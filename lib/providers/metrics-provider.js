/**
 * For detail information on aggregation in this module, see ../../METRIC-AGGREGATION.md
 */

"use strict";

const { EventEmitter } = require("events");
const _ = require("lodash");
const constants = require("../constants");
const time = require("../time");

// get the defined aggregation levels
const AGGREGATE_TIME_LEVELS = constants.AGGREGATE_TIME_LEVELS;

// what a valid time offset looks like
const TIME_LABEL_PATTERN = /^(\d+y)?\s*(\d{1,3}d)?\s*(\d{1,2})?(:\d{1,2})?(:\d{2})?$/i;

/**
 * This is the constructor for the MetricsProvider
 *
 * @param {Object} screen
 * The blessed screen object.
 *
 * @returns {void}
 */
const MetricsProvider
  = function MetricsProvider(screen) {
    /**
     * Setup the process to aggregate the data as and when it is necessary.
     *
     * @returns {void}
     */
    const setupAggregation
      = function setupAggregation() {
        // construct the aggregation container
        this._aggregation = _.reduce(AGGREGATE_TIME_LEVELS, (prev, timeLevel) => {
          prev[timeLevel] = {
            data: [],
            lastTimeIndex: undefined,
            lastAggregateIndex: 0,
            scrollOffset: 0
          };

          return prev;
        }, {});

        // an array of all available aggregation levels and metadata
        this.aggregationLevels = _.keys(this._aggregation);
        this.lowestAggregateTimeUnits = Number(this.aggregationLevels[0]);
        this.highestAggregationKey = _.last(this.aggregationLevels);

        // remember when all this started
        this._startTime = Date.now();

        // this is where we stopped aggregating
        this._lastAggregationIndex = 0;
      }.bind(this);

    EventEmitter.call(this);

    // the low-level container of all metrics provided
    this._metrics = [];

    // setup for aggregation
    setupAggregation();

    // initialize the zoom level to the lowest level
    this.setZoomLevel(0);

    // callback handlers
    screen.on("metrics", this._onMetrics.bind(this));
    screen.on("zoomGraphs", this.adjustZoomLevel.bind(this));
    screen.on("scrollGraphs", this.adjustScrollOffset.bind(this));
    screen.on("startGraphs", this.startGraphs.bind(this));
    screen.on("resetGraphs", this.resetGraphs.bind(this));
  };

// MetricsProvider inherits from EventEmitter
MetricsProvider.prototype = Object.create(EventEmitter.prototype);

/**
 * Given a moment in time, the start time, and time units, produce the
 * correct time index.
 *
 * @param {Number} currentTime
 * The current time.
 *
 * @param {Number} startTime
 * The start time, to derived elapsed time.
 *
 * @param {Number} aggregateTimeUnits
 * The time units to derive the index.
 *
 * @returns {Number}
 * The time index for the elapsed time is returned.
 */
const convertElapsedTimeToTimeIndex
  = function convertElapsedTimeToTimeIndex(
    currentTime,
    startTime,
    aggregateTimeUnits
  ) {
    return Math.floor((currentTime - startTime) / aggregateTimeUnits);
  };

/**
 * Get the reference to the current aggregation.
 *
 * @returns {Object}
 * The object reference is returned.
 */
MetricsProvider.prototype.getCurrentAggregation = function getCurrentAggregation() {
  return this._aggregation[this.zoomLevelKey];
};

/**
 * Set the zoom level desired.
 *
 * @param {Number} zoom
 * The desired zoom level.  It may be clamped.
 *
 * @returns {void}
 */
MetricsProvider.prototype.setZoomLevel = function setZoomLevel(zoom) {
  this.zoomLevel = _.clamp(zoom, 0, this.aggregationLevels.length - 1);
  this.zoomLevelKey = this.aggregationLevels[this.zoomLevel];
};

/**
 * Get the minimum and maximum times for the current zoom.
 *
 * @returns {Object}
 * An object containing the time range is returned
 */
MetricsProvider.prototype.getAvailableTimeRange = function getAvailableTimeRange() {
  const maxAverages = this._aggregation[this.lowestAggregateTimeUnits].data.length - 1;
  return {
    minTime: {
      label: time.getLabel(0),
      value: 0
    },
    maxTime: {
      label: time.getLabel(maxAverages * this.lowestAggregateTimeUnits),
      value: maxAverages * this.lowestAggregateTimeUnits
    }
  };
};

/**
 * Check to see if data exists at the current zoom level.
 *
 * @returns {Boolean}
 * Truthy if there is data, falsey otherwise.
 */
MetricsProvider.prototype.hasZoomLevelData = function hasZoomLevelData() {
  return this.getCurrentAggregation().data.length > 0;
};

/**
 * Adjust the zoom level using the delta provided.  The zoom level
 * may be clamped.  Once set, the consumer is notified.
 *
 * @param {Number} zoom
 * The delta to apply to the zoom level.
 *
 * @returns {void}
 */
MetricsProvider.prototype.adjustZoomLevel = function adjustZoomLevel(zoom) {
  // apply zoom delta while staying in boundaries
  this.setZoomLevel(this.zoomLevel + zoom);

  // if there is an aggregate at this level, but there is no data, go back a level
  while (!this.hasZoomLevelData() && this.zoomLevel > 0) {
    this.setZoomLevel(this.zoomLevel - 1);
  }

  this.emit("refreshMetrics");
};

/**
 * Adjust the scroll offset using the delta specified.  The scroll may
 * be clamped.  Once set, the consumer is notified.
 *
 * @param {Number} scroll
 * The scroll delta to apply.
 *
 * @param {Boolean} absolute
 * When truthy, the scroll is an absolute value.  When falsey,
 * the scroll is a relative value.
 *
 * @returns {void}
 */
MetricsProvider.prototype.adjustScrollOffset = function adjustScrollOffset(scroll, absolute) {
  const currentAggregation = this.getCurrentAggregation();

  // if absolute position is set, clear any existing scroll offset
  if (absolute) {
    currentAggregation.scrollOffset = 0;
  }

  // apply the offset (but do not go above zero)
  currentAggregation.scrollOffset
    = Math.min(currentAggregation.scrollOffset + scroll, 0);

  this.emit("refreshMetrics");
};

/**
 * Given a time value entered, go there.
 *
 * @param {String} timeValue
 * The time value to go to.
 *
 * @returns {void}
 */
MetricsProvider.prototype.gotoTimeValue = function gotoTimeValue(timeValue) {
  // set a goto offset
  this.gotoOffset = -convertElapsedTimeToTimeIndex(timeValue, 0, Number(this.zoomLevelKey));
  this.emit("refreshMetrics");
};

/**
 * Start the graphs at the beginning or the end of the data available.
 *
 * @param {Number} goto
 * If the goto value is negative, start at the beginning.  Otherwise,
 * use the end of the data set.
 *
 * @returns {void}
 */
MetricsProvider.prototype.startGraphs = function startGraphs(goto) {
  const adjustment = this.getCurrentAggregation().data.length * (goto < 0 ? -1 : 1);
  this.adjustScrollOffset(adjustment, true);
};

/**
 * Reset the graphs including offsets and zooming.  Once reset,
 * the consumer is notified.
 *
 * @returns {void}
 */
MetricsProvider.prototype.resetGraphs = function resetGraphs() {
  // reset to start zoom
  this.setZoomLevel(0);

  // clear all scroll offsets
  for (const aggregateKey in this._aggregation) {
    this._aggregation[aggregateKey].scrollOffset = 0;
  }

  this.emit("refreshMetrics");
};

/**
 * Check to see if the current zoom is scrolled.
 *
 * @returns {Boolean}
 * Truthy if it is scrolled, falsey otherwise.
 */
MetricsProvider.prototype.isScrolled = function isScrolled() {
  return !!this.getCurrentAggregation().scrollOffset;
};

/**
 * Check to see if the current zoom matches the aggregation specified.
 *
 * @param {String} aggregateKey
 * The aggregate key being processed.
 *
 * @returns {Boolean}
 * Truthy if the aggregation level matches the zoom level, falsey otherwise.
 */
MetricsProvider.prototype.isCurrentZoom = function isCurrentZoom(aggregateKey) {
  return this.zoomLevelKey === aggregateKey;
};

/**
 * Get the scroll offset for the current zoom.
 *
 * @returns {Number}
 * The scroll offset for the current zoom is returned.
 */
MetricsProvider.prototype.getCurrentScrollOffset = function getCurrentScrollOffset() {
  return this.getCurrentAggregation().scrollOffset;
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
const getInitializedAverage
  = function getInitializedAverage(data) {
    return _.reduce(data, (prev, a, dataKey) => {
      // create a first-level object of the key
      prev[dataKey] = {};

      _.each(data[dataKey], (b, dataMetricKey) => {
        // the metrics are properties inside this object
        prev[dataKey][dataMetricKey] = 0;
      });

      return prev;
    }, {});
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
const aggregateMetrics
  = function aggregateMetrics(currentTime, metricData) {
    let aggregateKey;

    /**
     * Place aggregate data into the specified slot.  If the current zoom
     * level matches the aggregate level, the data is emitted to keep the
     * display in sync.
     *
     * @param {Number} index
     * The desired slot for the aggregate.
     *
     * @param {Object} data
     * The aggregate data.
     *
     * @returns {void}
     */
    const setAggregateData
      = function setAggregateData(index, data) {
        this._aggregation[aggregateKey].data[index] = data;

        // if this view (current or not) is scrolled, adjust it
        if (this._aggregation[aggregateKey].scrollOffset) {
          this._aggregation[aggregateKey].scrollOffset--;
        }

        // emit to keep the display in sync
        if (this.isCurrentZoom(aggregateKey)) {
          if (this.isScrolled()) {
            this.emit("refreshMetrics");
          } else {
            this.emit("metrics", data);
          }
        }
      }.bind(this);

    /**
     * Given the current time time index, add any missing logical
     * time slots to have a complete picture of data.
     *
     * @param {Number} currentTimeIndex
     * The time index currently being processed.
     *
     * @returns {void}
     */
    const addMissingTimeSlots
      = function addMissingTimeSlots(currentTimeIndex) {
        let aggregateIndex = this._aggregation[aggregateKey].data.length;
        while (aggregateIndex < currentTimeIndex) {
          setAggregateData(aggregateIndex++, this.emptyAverage);
        }
      }.bind(this);

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
    const getAveragedAggregate
      = function getAveragedAggregate(rows, startIndex, endIndex) {
        const averagedAggregate = getInitializedAverage(metricData);

        // this is the number of elements we will aggregate
        const aggregateCount = endIndex - startIndex + 1;

        // you can compute an average of a set of numbers two ways
        // first, you can add all the numbers together and then divide by the count
        // second, you call divide each number by the count and add the quotients
        // the first method is more accurate, however you can overflow an accumulator
        // and result with NaN
        // the second method is employed here to ensure no overflows

        for (const dataKey in metricData) {
          for (const dataMetricKey in metricData[dataKey]) {
            for (let rowIndex = startIndex; rowIndex <= endIndex; rowIndex++) {
              averagedAggregate[dataKey][dataMetricKey]
                += rows[rowIndex][dataKey][dataMetricKey] / aggregateCount;
            }

            // after the average is done, truncate the averages to one decimal point
            averagedAggregate[dataKey][dataMetricKey]
              = Number(averagedAggregate[dataKey][dataMetricKey].toFixed(1));
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
     * @returns {void}
     */
    const processRow = function processRow(rowIndex, rows) {
      let averagedAggregate;
      const lastTimeIndex = this._aggregation[aggregateKey].lastTimeIndex;

      // get the time index of the aggregate
      const currentTimeIndex
        = convertElapsedTimeToTimeIndex(currentTime, this._startTime, Number(aggregateKey));

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
          setAggregateData(lastTimeIndex, averagedAggregate);

          // now we know where the next aggregate begins
          this._aggregation[aggregateKey].lastAggregateIndex = rowIndex;
        }

        // level-break
        this._aggregation[aggregateKey].lastTimeIndex = currentTimeIndex;
      }
    }.bind(this);

    // iterate over the configured aggregation time buckets
    for (aggregateKey in this._aggregation) {
      // iterate through metrics, beginning where we left off
      processRow(this._lastAggregationIndex, this._metrics);
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
MetricsProvider.prototype._onMetrics
  = function _onMetrics(data) {
    // get the current moment in time
    const currentTime = Date.now();

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
MetricsProvider.prototype.getMetrics
  = function getMetrics(limit) {
    const currentAggregation = this.getCurrentAggregation();

    /**
     * Given an offset and length, get the corrected offset.
     *
     * @param {Number} offset
     * The current offset value.
     *
     * @param {Number} length
     * The length of available data to offset.
     *
     * @returns {Number}
     * The corrected scroll offset is returned.
     */
    const getFixedScrollOffset
      = function getFixedScrollOffset(offset, length) {
        if (offset && length + offset <= limit) {
          return Math.min(limit - length, 0);
        }
        return Math.min(offset, 0);
      };

    // if there is a goto offset, try to place it in the center of the display
    if (this.gotoOffset !== undefined) {
      // eslint-disable-next-line no-magic-numbers
      currentAggregation.scrollOffset = this.gotoOffset + Math.floor(limit / 2);

      // once applied, remove it
      delete this.gotoOffset;
    }

    // correct the offset now that we know the width to display
    currentAggregation.scrollOffset
      = getFixedScrollOffset(currentAggregation.scrollOffset, currentAggregation.data.length);

    // if there is an offset, take that into account
    if (currentAggregation.scrollOffset) {
      // the three slices:
      // 1- limit to the available data at the time scrolling started
      // 2- get the back end of the array, given the scroll offset
      // 3- limit the final result to the limit originally specified
      return currentAggregation.data
        .slice(0, currentAggregation.data.length)
        .slice(-limit + currentAggregation.scrollOffset)
        .slice(0, limit);
    }
    // when there is no offset, just get the back end of the array
    // up to the desired limit specified
    return currentAggregation.data.slice(-limit);
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
MetricsProvider.prototype.getXAxis
  = function getXAxis(limit) {
    const scrollOffset = this.getCurrentScrollOffset();
    const xAxis = [];

    for (
      let timeIndex = -scrollOffset + limit - 1;
      timeIndex >= -scrollOffset;
      timeIndex--
    ) {
      xAxis.push(time.getLabel(timeIndex * Number(this.zoomLevelKey)));
    }

    return xAxis;
  };

/**
   * Given a time label value, validate it.
   *
   * @param {String} label
   * The time label to validate.
   *
   * @throws {Error}
   * An error is thrown if the time label is invalid.
   *
   * @returns {Number}
   * If the time label is valid, the time value is returned.
   */
MetricsProvider.prototype.validateTimeLabel
  = function validateTimeLabel(label) {
    const timeRange = this.getAvailableTimeRange();

    // can't be empty
    if (!label) {
      throw new Error("Time value is required");
    }

    // has to look right
    if (!TIME_LABEL_PATTERN.test(label)) {
      throw new Error("Enter a valid time value");
    }

    // must be able to convert (this can throw too)
    const timeValue = time.convertTimeLabelToMilliseconds(label);

    // must be a number in range
    if (isNaN(timeValue) || !_.inRange(timeValue, 0, timeRange.maxTime.value + 1)) {
      throw new Error(
        `Enter a time value between ${
          timeRange.minTime.label
        } and ${
          timeRange.maxTime.label}`
      );
    }

    return timeValue;
  };

module.exports = MetricsProvider;
