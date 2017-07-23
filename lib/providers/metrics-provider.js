"use strict";

/**
 * This module provides metric data for various data points.
 * The data provided is streamed in two modes: real time and aggregate.
 *
 * The real time data is simply a slice of the data that has been collected
 * over time.
 *
 * The aggregate data is data that has been rolled-up to various time increments.
 *
 * The strategy for aggregation centers around time indexes.  Imagine an array
 * of values and each element of that array being a data point.  If the data
 * is real-time, then each index is just one logical second.  When the data
 * is aggregated, each data point is the average of the data, for one logical
 * grouping of time.
 *
 * To determine which data elements from the real-time array are to be grouped,
 * the difference in time from the start of the process and the moment a data
 * point was captured is passed through this formula:
 *
 * Time Index = Math.floor((Data Point Time - Process Start Time) / Time Units)
 *
 * All Times are expressed in milliseconds (ms) and are obtained from Date.now().
 *
 * Example: Process Start Time 8798172749871
 *          Data Point Time    8798172756481
 *          Delta                       6610
 *          Time Units                  5000
 *          Quotient                       1.322
 *          Floor                          1
 *
 * The above example demonstrates that for a 5000ms (5s) aggregate, the time index
 * for the data point is one.  This formula is applied to all data points, so
 * when many data points share the same logical time index, they can be averaged.
 * When two or more array elements have a common time index, they form a time band.
 *
 * To efficiently perform the average, care is taken to reduce the number of
 * CPU cycles required to analyze the data.  To do this, any calculation that is
 * done on a data point (such as its time index) is stored.  This is necessary
 * because a given data point can be considered for aggregation into any number
 * of configured time aggregations.
 *
 * Also, to prevent re-aggregating the data needlessly, each aggregate level
 * maintains its position in the base array, thereby keeping track of where it
 * left off.  This is done using two simple numbers: the last array element
 * examined and the start of the current time band.
 *
 * So that data is still streamed on an event-basis, an aggregate data point is
 * only captured and emitted when it is complete.  To detect when an aggregate
 * is complete, the algorithm traverses the base real-time array of data, beginning
 * where it left off for any given aggregate.  Walking each element from there
 * forward, a simplistic level-break algorithm is implemented.  As and when a
 * logical time index changes, this indicates that the previous set of data is
 * complete.
 *
 * Once this occurs, the program then averages the data from the starting index
 * through the ending index that spans a logical time unit, regardless of aggregate
 * level (using the time index formula above).
 *
 * Image a set of tuples: (physical index, logical time index, value):
 *
 * [ 0,0,1.3 ], [ 1,0,4.5 ], [ 2,0,3.7], [3,1,4], [4,2,5.6], [5,2,0.3], [6,5,9.1]
 *
 * elements[0..2] have the same time index and when element[3] is encountered, a
 * change in time index is detected.  In state variables, the program knows to re-read
 * elements[0..2] and perform the average (shown below).  State variables update to
 * reflect this new end point where aggregation has been completed for that aggregate
 * level.
 *
 * The program continues and at the end of reading the data above, the average
 * would be:
 *
 * [ 3.2, 4, 2.9 ]
 *
 * The final tuple would not be processed because nothing came after it.  But when it
 * did get processed, the program would also include 0-averages for logical time
 * elements 3 and 4.  When a gap is detected between two logical time elements,
 * the program replaces them with averages equal to zero.
 *
 * To ensure no overflows (and therefore NaN) are produced, the average is done
 * using the formula on the left-side of this equivalence:
 *
 *     k[0]     k[1]     k[2]           k[n - 1]     sum([k0...kn-1])
 *    ------ + ------ + ------ + ... + ---------- = ---------------- = avg([k0...kn-1])
 *      n        n        n                n               n
 *
 * The sum of memory usage even over a 10s aggregate is enough to produce NaN.
 */

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
            nextAggregateIndex: 0
          };
        }

        // an array of all available aggregation levels and metadata
        this.aggregationLevels = Object.keys(this._aggregation);
        this.minimumAggregationInterval = +this.aggregationLevels[0];
        this.highestAggregationKey = _.last(this.aggregationLevels);

        // this is an exploit; arrays are zero-based so -1 index will be undefined
        // that is intentional - when the zoomLevelKey is undefined, we use real-time
        this.zoomLevel = -1;
        this.zoomLevelKey = this.aggregationLevels[this.zoomLevel];

        // remember when all this started
        this._startTime = Date.now();
        this._lastAggregationTime = this._startTime;

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
     * Given the current time and last time index, add any missing logical
     * time slots to have a complete picture of data.
     *
     * @param {Number} currentTimeIndex
     * The time index currently being processed.
     *
     * @param {Number} previousTimeIndex
     * The time index previously processed.
     *
     * @this MetricsProvider
     *
     * @returns {void}
     */
    var addMissingTimeSlots =
      function addMissingTimeSlots(currentTimeIndex, previousTimeIndex) {
        // compute the delta in the two logical time slots
        var missingTimeSlots = currentTimeIndex - previousTimeIndex;

        // see if there is a gap in time
        if (missingTimeSlots > 1) {
          // add empty spots for missed time
          while (--missingTimeSlots > 0) {
            // populate these missing time slots with an empty aggregate
            this._aggregation[aggregateKey].data.push(this.emptyAverage);

            // emit to keep the display in sync
            if (aggregateKey === this.zoomLevelKey) {
              this.emit("metrics", this.emptyAverage);
            }
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
     * @param {Object} row
     * The row being processed.
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
    var processRow = function processRow(row, rowIndex, rows) {
      var averagedAggregate;

      // get the time index of the aggregate
      var thisTimeIndex = Math.floor((currentTime - this._startTime) / +aggregateKey);

      // when the time index changes, average the data for the time band
      if (thisTimeIndex !== this._aggregation[aggregateKey].lastTimeIndex) {
        // except for the first one
        if (this._aggregation[aggregateKey].lastTimeIndex !== undefined) {
          // add in any missing logical time slots
          addMissingTimeSlots.call(
            this,
            thisTimeIndex,
            this._aggregation[aggregateKey].lastTimeIndex
          );

          // get the average across the discovered time band
          averagedAggregate = getAveragedAggregate(
            rows,
            this._aggregation[aggregateKey].nextAggregateIndex,
            rowIndex - 1
          );

          // add the average
          this._aggregation[aggregateKey].data.push(averagedAggregate);

          // when in aggregate mode and the aggregate just produced is in the current view
          // emit the average now
          if (aggregateKey === this.zoomLevelKey) {
            this.emit("metrics", averagedAggregate);
          }

          // now we know where the next aggregate begins
          this._aggregation[aggregateKey].nextAggregateIndex = rowIndex;
        }

        // level-break
        this._aggregation[aggregateKey].lastTimeIndex = thisTimeIndex;
      }
    };

    // iterate over the configured aggregation time buckets
    for (aggregateKey in this._aggregation) {
      // iterate through metrics, beginning where we left off
      for (
        var rowIndex = this._lastAggregationIndex;
        rowIndex < this._metrics.length;
        rowIndex++
      ) {
        processRow.call(this, this._metrics[rowIndex], rowIndex, this._metrics);
      }
    }

    // remember where we will begin again
    this._lastAggregationIndex = this._metrics.length;
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

    // if we are showing aggregate data, that is emitted in the aggregateMetrics
    // function; otherwise, emit the newly received metric data here
    if (!this.zoomLevelKey) {
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
    var scaleIndex = 0;
    var timeValue = timeIndex * aggregateTimeUnits;

    if (timeIndex === 0) {
      return "0s";
    }

    // progressively reduce by units of time
    while (scaleIndex < TIME_SCALES.length && timeValue >= TIME_SCALES[scaleIndex].divisor) {
      timeValue /= TIME_SCALES[scaleIndex++].divisor;
    }

    // convert to one decimal point, if any
    if (timeValue !== Math.floor(timeValue)) {
      return timeValue.toFixed(1) + TIME_SCALES[scaleIndex - 1].units;
    }

    // return the label (ex: 2.4m)
    // it is noteworthy that I did create the Clash of Clans style label too
    // (ex 2m 24s = 2.4m but it didn't look that hot when it was on the screen)
    return timeValue + TIME_SCALES[scaleIndex - 1].units;
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

  if (this.zoomLevelKey) {
    for (timeIndex = limit - 1; timeIndex >= 0; timeIndex--) {
      xAxis.push(getTimeIndexLabel(timeIndex, +this.zoomLevelKey));
    }
  } else {
    for (timeIndex = limit - 1; timeIndex >= 0; timeIndex--) {
      xAxis.push(timeIndex + "s");
    }
  }

  return xAxis;
};

module.exports = MetricsProvider;
