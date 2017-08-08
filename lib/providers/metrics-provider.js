/**
 * For detail information on aggregation in this module, see ../../METRIC-AGGREGATION.md
 */

"use strict";

var EventEmitter = require("events").EventEmitter;
var _ = require("lodash");

// get the defined aggregation levels
var AGGREGATE_TIME_LEVELS = require("../constants.js").AGGREGATE_TIME_LEVELS;
var TIME_SCALES = require("../constants.js").TIME_SCALES;

/**
 * This is the constructor for the MetricsProvider
 *
 * @param {Object} screen
 * The blessed screen object.
 *
 * @returns {void}
 */
var MetricsProvider =
  function MetricsProvider(screen) {

    /**
     * Setup the process to aggregate the data as and when it is necessary.
     *
     * @this MetricsProvider
     *
     * @returns {void}
     */
    var setupAggregation =
      function setupAggregation() {
        // construct the aggregation container
        this._aggregation = {};
        for (var index = 0; index < AGGREGATE_TIME_LEVELS.length; index++) {
          this._aggregation[AGGREGATE_TIME_LEVELS[index]] = {
            data: [],
            lastTimeIndex: undefined,
            lastAggregateIndex: 0
          };
        }

        // an array of all available aggregation levels and metadata
        this.aggregationLevels = Object.keys(this._aggregation);
        this.highestAggregationKey = _.last(this.aggregationLevels);

        // this is an exploit; arrays are zero-based so -1 index will be undefined
        // that is intentional - when the zoomLevelKey is undefined, we use real-time
        this.zoomLevel = -1;
        this.zoomLevelKey = this.aggregationLevels[this.zoomLevel];

        // remember when all this started
        this._startTime = Date.now();

        // this is where we stopped aggregating
        this._lastAggregationIndex = 0;
      };

    EventEmitter.call(this);

    // the low-level container of all metrics provided
    this._metrics = [];

    // setup for aggregation
    setupAggregation.call(this);

    // metrics data receiver callback handler
    screen.on("metrics", this._onMetrics.bind(this));

    // zoom callback handler
    screen.on("zoomGraphs", this.adjustZoomLevel.bind(this));
  };

// MetricsProvider inherits from EventEmitter
MetricsProvider.prototype = Object.create(EventEmitter.prototype);

// the zoomGraphs callback handler
MetricsProvider.prototype.adjustZoomLevel = function adjustZoomLevel(zoom) {
  // apply zoom delta while staying in boundaries
  this.zoomLevel = _.clamp(this.zoomLevel + zoom, -1, this.aggregationLevels.length - 1);

  // now, reflect the change to the zoom level
  this.zoomLevelKey = this.aggregationLevels[this.zoomLevel];

  // if there is an aggregate at this level, but there is no data, go back a level
  while (
    this.zoomLevelKey
    && this._aggregation[this.zoomLevelKey].data.length === 0) {
    this.zoomLevel = Math.max(this.zoomLevel - 1, -1);
    this.zoomLevelKey = this.aggregationLevels[this.zoomLevel];
  }

  this.emit("metricData");
};

/**
 * Given a metric data object, construct an initialized average.
 *
 * @param {Object} data
 * The metric data received.
 *
 * @returns {Object}
 * The initialized average object is returned.
 */
var getInitializedAverage =
  function getInitializedAverage(data) {
    var average = {};

    for (var dataKey in data) {
      average[dataKey] = {};

      for (var dataMetricKey in data[dataKey]) {
        average[dataKey][dataMetricKey] = 0;
      }
    }

    return average;
  };

/**
 * Perform event-driven aggregation at all configured units of time.
 *
 * @param {Number} currentTime
 * The current time of the aggregation.
 *
 * @param {Object} metricData
 * The metric data template received.
 *
 * @this MetricsProvider
 *
 * @returns {void}
 */
var aggregateMetrics =
  function aggregateMetrics(currentTime, metricData) {
    var aggregateKey;

    /**
     * Given the current time time index, add any missing logical
     * time slots to have a complete picture of data.
     *
     * @param {Number} currentTimeIndex
     * The time index currently being processed.
     *
     * @this MetricsProvider
     *
     * @returns {void}
     */
    var addMissingTimeSlots =
      function addMissingTimeSlots(currentTimeIndex) {
        var aggregateIndex = this._aggregation[aggregateKey].data.length;

        while (aggregateIndex < currentTimeIndex) {
          this._aggregation[aggregateKey].data[aggregateIndex++] = this.emptyAverage;

          // emit to keep the display in sync
          if (aggregateKey === this.zoomLevelKey) {
            this.emit("metrics", this.emptyAverage);
          }
        }
      };

    /**
     * After having detected a new sampling, aggregate the relevant data points
     *
     * @param {Object[]} rows
     * The array reference.
     *
     * @param {Number} startIndex
     * The starting index to derive an average.
     *
     * @param {Number} endIndex
     * The ending index to derive an average.
     *
     * @returns {void}
     */
    var getAveragedAggregate =
      function getAveragedAggregate(rows, startIndex, endIndex) {
        var averagedAggregate = getInitializedAverage(metricData);

        // this is the number of elements we will aggregate
        var aggregateCount = endIndex - startIndex + 1;

        // you can compute an average of a set of numbers two ways
        // first, you can add all the numbers together and then divide by the count
        // second, you call divide each number by the count and add the quotients
        // the first method is more accurate, however you can overflow an accumulator
        // and result with NaN
        // the second method is employed here to ensure no overflows

        for (var dataKey in metricData) {
          for (var dataMetricKey in metricData[dataKey]) {
            for (var rowIndex = startIndex; rowIndex <= endIndex; rowIndex++) {
              averagedAggregate[dataKey][dataMetricKey] +=
                rows[rowIndex][dataKey][dataMetricKey] / aggregateCount;
            }

            // after the average is done, truncate the averages to one decimal point
            averagedAggregate[dataKey][dataMetricKey] =
              +averagedAggregate[dataKey][dataMetricKey].toFixed(1);
          }
        }

        return averagedAggregate;
      };

    /**
     * Process one row of metric data into aggregate.
     *
     * @param {Number} rowIndex
     * The index of the row being processed.
     *
     * @param {Object[]} rows
     * The array reference.
     *
     * @this MetricsProvider
     *
     * @returns {void}
     */
    var processRow = function processRow(rowIndex, rows) {
      var averagedAggregate;
      var lastTimeIndex = this._aggregation[aggregateKey].lastTimeIndex;

      // get the time index of the aggregate
      var currentTimeIndex = Math.floor((currentTime - this._startTime) / +aggregateKey);

      // when the time index changes, average the data for the time band
      if (currentTimeIndex !== lastTimeIndex) {
        // except for the first one
        if (lastTimeIndex !== undefined) {
          // add in any missing logical time slots
          addMissingTimeSlots.call(this, lastTimeIndex);

          // get the average across the discovered time band
          averagedAggregate = getAveragedAggregate(
            rows,
            this._aggregation[aggregateKey].lastAggregateIndex,
            rowIndex - 1
          );

          // place the average
          this._aggregation[aggregateKey].data[lastTimeIndex] = averagedAggregate;

          // when in aggregate mode and the aggregate just produced is in the current view
          // emit the average now
          if (aggregateKey === this.zoomLevelKey) {
            this.emit("metrics", averagedAggregate);
          }

          // now we know where the next aggregate begins
          this._aggregation[aggregateKey].lastAggregateIndex = rowIndex;
        }

        // level-break
        this._aggregation[aggregateKey].lastTimeIndex = currentTimeIndex;
      }
    };

    // iterate over the configured aggregation time buckets
    for (aggregateKey in this._aggregation) {
      // iterate through metrics, beginning where we left off
      processRow.call(
        this,
        this._lastAggregationIndex,
        this._metrics
      );
    }

    // remember where we will begin again
    this._lastAggregationIndex++;
  };

/**
 * When metrics are received collect, aggregate, and emit them.
 *
 * @param {Object} data
 * The metrics data received.
 *
 * @returns {void}
 */
MetricsProvider.prototype._onMetrics =
  function _onMetrics(data) {
    // get the current moment in time
    var currentTime = Date.now();

    // capture the metrics
    this._metrics.push(data);

    // one time, build an empty average - used for missing time slots
    if (!this.emptyAverage) {
      this.emptyAverage = getInitializedAverage(data);
    }

    // run aggregation process
    aggregateMetrics.call(this, currentTime, data);

    // always emit the data, but send a new arg to indicates whether
    // zoom is in effect (and therefore should be ignored)
    this.emit("metrics", data, this.zoomLevelKey !== undefined);
  };

/**
 * Provide all the metrics desired, up to the limit.
 *
 * @param {Number} limit
 * The limit of the metrics to return.
 *
 * @returns {Number[]}
 * The array of metrics is returned.
 */
MetricsProvider.prototype.getMetrics =
  function getMetrics(limit) {
    var metrics;

    if (this.zoomLevelKey) {
      metrics = this._aggregation[this.zoomLevelKey].data.slice(-limit);
    } else {
      metrics = this._metrics.slice(-limit);
    }

    return metrics;
  };

/**
 * Given a time index and unit of time measure, compute a condensed, human-readable label.
 *
 * @param {Number} timeIndex
 * The logical index of time.
 *
 * @param {Number} aggregateTimeUnits
 * The unit of time measure.
 *
 * @returns {String}
 * A scaled, string-representation of time at the index is returned.
 */
var getTimeIndexLabel =
  function getTimeIndexLabel(timeIndex, aggregateTimeUnits) {
    var DIGITS_PER_UNIT = 2;

    var timeValue = timeIndex * aggregateTimeUnits;
    var timeElements = [];

    if (timeValue === 0) {
      return ":00";
    }

    _.every(TIME_SCALES, function (timeScale, index, timeScales) {
      var timeElement = {
        units: timeScale.units,
        value: 0
      };

      // stop reducing when it cannot be divided
      if (timeValue < timeScale.divisor) {
        return false;
      }

      // don't capture a time element for milliseconds
      if (timeScale.units !== "ms") {
        // reduce by the divisor
        timeElement.value = timeValue / timeScale.divisor;

        // if there are more elements after, take the modulo to get the remainder
        if (index < timeScales.length - 1) {
          timeElement.value = Math.floor(timeElement.value % timeScales[index + 1].divisor);
        } else {
          timeElement.value = Math.floor(timeElement.value);
        }

        timeElements.push(timeElement);
      }

      // reduce
      timeValue /= timeScale.divisor;

      return true;
    });


    return _.reduce(timeElements, function (prev, curr, index) {
      switch (curr.units) {
      case "s":
        return ":" + _.padStart(curr.value, DIGITS_PER_UNIT, "0");
      case "m":
      case "h":
        if (index < timeElements.length - 1) {
          return (curr.units === "m" ? ":" : " ")
            + _.padStart(curr.value, DIGITS_PER_UNIT, "0")
            + prev;
        } else {
          return curr.value + prev;
        }
      default:
        return curr.value + curr.units + prev;
      }
    }, "");
  };

/**
 * Return the X-Axis for the metrics.
 *
 * @param {Number} limit
 * The limit of the X-Axis size.
 *
 * @returns {String[]}
 * The X-Axis labels array is returned.
 */
MetricsProvider.prototype.getXAxis = function getXAxis(limit) {
  var xAxis = [];

  for (var timeIndex = limit - 1; timeIndex >= 0; timeIndex--) {
    xAxis.push(getTimeIndexLabel(timeIndex, +this.zoomLevelKey || TIME_SCALES[1].divisor));
  }

  return xAxis;
};

module.exports = MetricsProvider;
