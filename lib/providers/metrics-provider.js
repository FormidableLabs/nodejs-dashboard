"use strict";

var EventEmitter = require("events").EventEmitter;
var config = require("../config.js");

// time scaling factors
var timeScales = [
  {
    units: "ms",
    divisor: 1
  }, {
    units: "s",
    divisor: 1000
  }, {
    units: "m",
    divisor: 60
  }, {
    units: "h",
    divisor: 60
  }, {
    units: "d",
    divisor: 24
  }, {
    units: "y",
    divisor: 365.24
  }
];

/**
 * Compute the logical array index for a given data point in time, relative
 * to start, considering measure of time units.
 *
 * @param {Number} startTime
 * The start of the process.
 *
 * @param {Number} metricTime
 * The moment in time for this data point.
 *
 * @param {Number} aggregateTimeUnits
 * The measure of units of time for scaling.
 *
 * @returns {Number}
 * The logical array index is returned.
 */
var getAggregateTimeIndex =
  function getAggregateTimeIndex(startTime, metricTime, aggregateTimeUnits) {
    return Math.floor((metricTime - startTime) / aggregateTimeUnits);
  };

/**
 * Given a metric data object, construct an initialized aggregator.
 *
 * @param {Object} data
 * The metric data received.
 *
 * @returns {Object}
 * The initialized aggregator object is returned.
 */
var getInitializedAggregate =
  function getInitializedAggregate(data) {
    var aggregate = {};

    for (var dataKey in data) {
      aggregate[dataKey] = {};

      for (var dataMetricKey in data[dataKey]) {
        aggregate[dataKey][dataMetricKey] = {
          values: []
        };
      }
    }

    return aggregate;
  };

/**
 * Given a metric data template and an aggregator, average the data.
 *
 * @param {Object} data
 * The metric data received.
 *
 * @param {Object} aggregate
 * The aggregator object to aggregate.
 *
 * @returns {Object}
 * The average of the aggregator object is returned.
 */
var getAveragedAggregate =
  function getAveragedAggregate(data, aggregate) {
    var averagedAggregate = {};

    for (var dataKey in data) {
      averagedAggregate[dataKey] = {};

      for (var dataMetricKey in data[dataKey]) {
        averagedAggregate[dataKey][dataMetricKey] = 0;

        // the empty aggregate is created with zero values
        if (!aggregate) {
          continue;
        }

        // you can compute an average of a set of numbers two ways
        // first, you can add all the numbers together and then divide by the count
        // second, you call divide each number by the count and add the quotients
        // the first method is more accurate, however you can overflow an accumulator
        // and result with NaN
        // the second method is employed here to ensure no overflows
        for (var index = 0; index < aggregate[dataKey][dataMetricKey].values.length; index++) {
          averagedAggregate[dataKey][dataMetricKey] +=
            aggregate[dataKey][dataMetricKey].values[index] /
            aggregate[dataKey][dataMetricKey].values.length;
        }

        // truncate the number to one decimal point
        averagedAggregate[dataKey][dataMetricKey] =
          +averagedAggregate[dataKey][dataMetricKey].toFixed(1);
      }
    }

    return averagedAggregate;
  };

/**
 * Given a metric data template, and a metric data point, accumulate into the
 * aggregator.
 *
 * @param {Object} data
 * The metric data template received.
 *
 * @param {Object} metric
 * The metric data point received.
 *
 * @param {Object} aggregate
 * The aggregator object.
 *
 * @returns {void}
 */
var accumulateAggregate =
  function accumulateAggregate(data, metric, aggregate) {
    for (var dataKey in data) {
      for (var dataMetricKey in data[dataKey]) {
        aggregate[dataKey][dataMetricKey].values.push(metric[dataKey][dataMetricKey]);
      }
    }
  };

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
    EventEmitter.call(this);

    this._metrics = [];

    // construct the aggregation container
    this._aggregation = {};
    for (var index = 0; index < config.AGGREGATE_TIME_BUCKETS.length; index++) {
      this._aggregation[config.AGGREGATE_TIME_BUCKETS[index]] = {
        lastIndex: 0,
        data: []
      };
    }

    this.aggregationLevels = Object.keys(this._aggregation);
    this.currentAggregateZoom = -1;
    this.currentAggregateZoomKey = this.aggregationLevels[this.currentAggregateZoom];
    this.minimumAggregationInterval = +this.aggregationLevels[0];

    this._startTime = Date.now();
    this._lastAggregation = Date.now();

    screen.on("metrics", this._onMetrics.bind(this));

    screen.on("zoomAggregate", function zoomAggregate(zoom) {
      // apply zoom delta and check for boundaries
      this.currentAggregateZoom += zoom;
      if (this.currentAggregateZoom < -1) {
        this.currentAggregateZoom = -1;
      } else if (this.currentAggregateZoom >= this.aggregationLevels.length - 1) {
        this.currentAggregateZoom = this.aggregationLevels.length - 1;
      }

      // now, reflect the change to the zoom level
      this.currentAggregateZoomKey = this.aggregationLevels[this.currentAggregateZoom];

      // if there is an aggregate at this level, but there is no data, go back a level
      while (
        this.currentAggregateZoomKey
        && this._aggregation[this.currentAggregateZoomKey].data.length === 0) {
        this.currentAggregateZoom = Math.max(this.currentAggregateZoom - 1, -1);
        this.currentAggregateZoomKey = this.aggregationLevels[this.currentAggregateZoom];
      }
    }.bind(this));
  };

// MetricsProvider inherits from EventEmitter
MetricsProvider.prototype = Object.create(EventEmitter.prototype);

/**
 * Perform event-driven aggregation at all configured units of time.
 *
 * @param {Number} currentTime
 * The current time of the aggregation.
 *
 * @param {Object} data
 * The metric data template received.
 *
 * @this MetricsProvider
 *
 * @returns {void}
 */
var aggregateMetrics =
  function aggregateMetrics(currentTime, data) {
    var aggregate;
    var aggregateKey;
    var metricIndex;
    var lastTimeIndex;
    var thisTimeIndex;

    /**
     * Given the current time and last time index, add any missing logical
     * time slots to have a complete picture of data.
     *
     * @this MetricsProvider
     *
     * @returns {void}
     */
    var addMissingTimeSlots =
      function addMissingTimeSlots() {
        // compute the delta in the two logical time slots
        var missingTimeSlots = thisTimeIndex - lastTimeIndex;

        // see if there is a gap in time
        if (missingTimeSlots > 1) {
          // add empty spots for missed time
          while (--missingTimeSlots > 0) {
            // populate these missing time slots with an empty aggregate
            this._aggregation[aggregateKey].data.push(this.emptyAggregate);

            // emit to keep the display in sync
            if (aggregateKey === this.currentAggregateZoomKey) {
              this.emit("metrics", this.emptyAggregate);
            }
          }
        }
      };

    /**
     * Add a new average aggregate to the aggregate container.
     *
     * @this MetricsProvider
     *
     * @returns {void}
     */
    var addAverageAggregate =
      function addAverageAggregate() {
        // average the aggregate data
        var averagedAggregate = getAveragedAggregate(data, aggregate);

        // add the aggregate
        this._aggregation[aggregateKey].data.push(averagedAggregate);

        // when in aggregate mode and the aggregate just produced is in the current view
        // emit the average now
        if (aggregateKey === this.currentAggregateZoomKey) {
          this.emit("metrics", averagedAggregate);
        }

        // construct an initialized aggregate
        aggregate = getInitializedAggregate(data);
      };

    /**
     * Process one row of metric data into aggregate.
     *
     * @this MetricsProvider
     *
     * @returns {void}
     */
    var processRow = function processRow() {
      // compute the time index of the aggregate
      thisTimeIndex =
        getAggregateTimeIndex(
          this._startTime,
          this._metrics[metricIndex].__currentTime,
          +aggregateKey
        );

      // when the time index changes, average the data accumulated thus far
      if (thisTimeIndex !== lastTimeIndex) {
        // except for the first one
        if (lastTimeIndex !== undefined) {
          // add in any missing logical time slots
          addMissingTimeSlots.call(this);

          // add a new averaged aggregate to the aggregate structure
          addAverageAggregate.call(this);

          // remember where we stopped
          this._aggregation[aggregateKey].lastIndex = metricIndex;
        }

        // level-break
        lastTimeIndex = thisTimeIndex;
      }

      // accumulate the data
      accumulateAggregate(data, this._metrics[metricIndex], aggregate);
    };

    // iterate over the configured aggregation time buckets
    for (aggregateKey in this._aggregation) {
      // construct an initialized aggregate
      aggregate = getInitializedAggregate(data);

      // iterate through metrics, beginning where we left off
      for (
        metricIndex = this._aggregation[aggregateKey].lastIndex;
        metricIndex < this._metrics.length;
        metricIndex++
      ) {
        processRow.call(this);
      }

      // reset for the next value
      lastTimeIndex = undefined;
    }
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
    var currentTime = Date.now();

    // attach the current clock reading to the metrics
    this._metrics.push(Object.assign({ __currentTime: currentTime }, data));

    // one time, build an empty aggregate - used for missing time slots
    if (!this.emptyAggregate) {
      this.emptyAggregate = getAveragedAggregate(data);
    }

    // see if it is time once again to aggregate some data
    if (currentTime - this._lastAggregation >= this.minimumAggregationInterval) {
      aggregateMetrics.call(this, currentTime, data);

      // aggregation is complete; save this position in time
      this._lastAggregation = currentTime;
    }

    // if we are showing aggregate data, that is emitted in the aggregateMetrics
    // function; otherwise, emit the newly received metric data here
    if (!this.currentAggregateZoomKey) {
      this.emit("metrics", data);
    }
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

    if (this.currentAggregateZoomKey) {
      metrics = this._aggregation[this.currentAggregateZoomKey].data.slice(-limit);
    } else {
      metrics = this._metrics.slice(-limit);
    }

    if (metrics.length === 0 && this.emptyAggregate) {
      metrics.push(this.emptyAggregate);
    }

    return metrics;
  };

/**
 * Given a time index and unit of time measure, scale the value for screen real estate.
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
var getTimeIndexScale =
  function getTimeIndexScale(timeIndex, aggregateTimeUnits) {
    var timeValue = timeIndex * aggregateTimeUnits;
    var units;

    if (timeIndex === 0) {
      return "0s";
    }

    for (var scaleIndex = 0; scaleIndex < timeScales.length; scaleIndex++) {
      if (timeValue >= timeScales[scaleIndex].divisor) {
        timeValue /= timeScales[scaleIndex].divisor;
        units = timeScales[scaleIndex].units;
      } else {
        break;
      }
    }

    if (timeValue !== Math.floor(timeValue)) {
      return timeValue.toFixed(1) + units;
    }

    return timeValue + units;
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
  var timeIndex;
  var xAxis = [];

  if (this.currentAggregateZoomKey) {
    for (timeIndex = limit - 1; timeIndex >= 0; timeIndex--) {
      xAxis.push(getTimeIndexScale(timeIndex, +this.currentAggregateZoomKey));
    }
  } else {
    for (timeIndex = limit - 1; timeIndex >= 0; timeIndex--) {
      xAxis.push(timeIndex + "s");
    }
  }

  return xAxis;
};

module.exports = MetricsProvider;
