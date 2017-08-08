/* eslint-disable max-statements,no-magic-numbers,max-nested-callbacks */

"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");

var AGGREGATE_TIME_LEVELS = require("../../../lib/constants.js").AGGREGATE_TIME_LEVELS;

var utils = require("../../utils");
var MetricsProvider = require("../../../lib/providers/metrics-provider");

describe("MetricsProvider", function () {
  var sandbox;
  var testContainer;
  var metricsProvider;

  var stubNow;
  var mockStart;
  var mockNow;
  var mockTimeInterval;

  var mockMetrics;
  var mockMetricCount;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();

    mockStart = 10000000;
    mockNow = mockStart;
    mockTimeInterval = 2500;

    stubNow = sandbox.stub(Date, "now", function () {
      var currentTime = mockNow;
      mockNow += mockTimeInterval;
      return currentTime;
    });

    testContainer = utils.getTestContainer(sandbox);
    metricsProvider = new MetricsProvider(testContainer.screen);

    // generate some fake metrics for processing
    var metricsRequiredToAchieveHighestAggregation =
      +_.last(AGGREGATE_TIME_LEVELS) / mockTimeInterval;
    mockMetrics = [];
    mockMetricCount =
      Math.ceil(Math.random() * 500 + metricsRequiredToAchieveHighestAggregation);

    for (var index = 0; index < mockMetricCount; index++) {
      mockMetrics.push({
        metricA: {
          valueA: Math.random() * 100
        },
        metricB: {
          valueA: Math.random() * 100,
          valueB: Math.random() * 100
        }
      });
    }
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("constructor", function () {
    it("builds an aggregation container from configuration", function () {
      expect(metricsProvider).to.be.an.instanceOf(MetricsProvider);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("_aggregation")
        .which.is.an("object")
        .with.keys(AGGREGATE_TIME_LEVELS);

      var index = 0;
      _.each(metricsProvider._aggregation, function (value, key) {
        expect(key)
          .to.be.a("string")
          .that.equals(AGGREGATE_TIME_LEVELS[index++]);

        expect(value)
          .to.be.an("object")
          .that.deep.equals({
            data: [],
            lastTimeIndex: undefined,
            lastAggregateIndex: 0
          });
      });

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("aggregationLevels")
        .which.is.an("array")
        .that.deep.equals(AGGREGATE_TIME_LEVELS);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("highestAggregationKey")
        .which.is.a("string")
        .that.equals(_.last(AGGREGATE_TIME_LEVELS));

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("zoomLevel")
        .which.is.a("number")
        .that.equals(-1);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("zoomLevelKey")
        .that.is.undefined;

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("_startTime")
        .which.is.a("number")
        .that.equals(mockStart);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("_lastAggregationIndex")
        .which.is.a("number")
        .that.equals(0);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("_metrics")
        .which.is.an("array")
        .that.deep.equals([]);
    });
  });

  describe("_onMetrics", function () {
    // due to the quantity of data processed, notice the .timeout at the bottom - this allows
    // for a longer running test
    it("retains metrics received, while aggregating them into time buckets", function () {
      // this test case utilizes a uniform time-event approach to validation
      // an event is generated exactly evenly until a sufficient number of them have
      // been computed

      // given the uniform nature of this data set, the test case can verify the
      // aggregation logic works by comparing raw input data to an expected average

      // load with mock metric data already computed
      _.each(mockMetrics, function (value) {
        metricsProvider._onMetrics(value);
      });

      // the number of data points retained must match the number provided
      expect(metricsProvider)
        .to.be.an("object")
        .with.property("_metrics")
        .which.is.an("array")
        .that.has.lengthOf(mockMetricCount);

      // now, examine each metric
      _.each(metricsProvider._metrics, function (value, index) {
        expect(value)
          .to.be.an("object")
          .with.property("metricA")
          .with.property("valueA")
          .that.equals(mockMetrics[index].metricA.valueA);

        expect(value)
          .to.be.an("object")
          .with.property("metricB")
          .with.property("valueA")
          .that.equals(mockMetrics[index].metricB.valueA);

        expect(value)
          .to.be.an("object")
          .with.property("metricB")
          .with.property("valueB")
          .that.equals(mockMetrics[index].metricB.valueB);
      });

      _.each(metricsProvider._aggregation, function (value, key) {
        _.each(value.data, function (row, index) {
          // reverse-engineer the start and end of this time band
          var startTimeBand = index * Math.floor(+key / mockTimeInterval) - 1;
          var endTimeBand = startTimeBand + Math.floor(+key / mockTimeInterval);

          // the first time band is offset by a time interval (call to Date.now at start)
          if (index === 0) {
            startTimeBand = 0;
          }

          var averageA = {
            valueA: 0
          };

          var averageB = {
            valueA: 0,
            valueB: 0
          };

          var metricCount = endTimeBand - startTimeBand;

          // recompute the average manually
          _.each(metricsProvider._metrics.slice(startTimeBand, endTimeBand), function (metric) {
            averageA.valueA += metric.metricA.valueA / metricCount;

            averageB.valueA += metric.metricB.valueA / metricCount;
            averageB.valueB += metric.metricB.valueB / metricCount;
          });

          // verify
          expect(row)
            .to.be.an("object")
            .with.property("metricA")
            .with.property("valueA")
            .which.is.a("number")
            .that.equals(+averageA.valueA.toFixed(1));

          expect(row)
            .to.be.an("object")
            .with.property("metricB")
            .with.property("valueA")
            .which.is.a("number")
            .that.equals(+averageB.valueA.toFixed(1));

          expect(row)
            .to.be.an("object")
            .with.property("metricB")
            .with.property("valueB")
            .which.is.a("number")
            .that.equals(+averageB.valueB.toFixed(1));
        });
      });
    }).timeout(10000);

    it("aggregates data for non-uniform data sets too", function () {
      // this test case differs from the previous in that instead of using a perfectly
      // uniform set of data, this one computes "time bands", which represent events that
      // occur sporadically, but still within a known number of data elements

      // this is captured so that the averages can then still be compared against
      // randomly computed data

      // this data set will also produce gaps in time to test the gap logic

      var mockMetricsThisTimeBand;
      var timeBands = [];
      var totalTimeBands = Math.ceil(+_.last(AGGREGATE_TIME_LEVELS) / +AGGREGATE_TIME_LEVELS[0]);
      var maximumTimeGaps = 10;
      var timeGaps = 0;

      mockNow = mockStart;
      var timeBandStart = mockNow;

      mockMetrics = [];

      stubNow.restore();

      mockTimeInterval = +AGGREGATE_TIME_LEVELS[0];
      stubNow = sandbox.stub(Date, "now", function () {
        var currentTime = mockNow;
        mockNow += Math.floor(mockTimeInterval / mockMetricsThisTimeBand) - 1;
        return currentTime;
      });

      while (timeBands.length < totalTimeBands) {
        mockMetricsThisTimeBand = Math.floor(Math.random() * 5);

        if (timeGaps < maximumTimeGaps && Math.random() < 0.1) {
          timeGaps++;
          mockMetricsThisTimeBand = 0;
        }

        var timeBand = {
          count: mockMetricsThisTimeBand,
          data: [],
          startIndex: mockMetrics.length,
          endIndex: mockMetrics.length + mockMetricsThisTimeBand
        };

        for (var metricIndex = 0; metricIndex < timeBand.count; metricIndex++) {
          var mockMetric = {
            metricA: {
              valueA: Math.random() * 100
            },
            metricB: {
              valueA: Math.random() * 100,
              valueB: Math.random() * 100
            }
          };

          metricsProvider._onMetrics(mockMetric);
          mockMetrics.push(mockMetric);

          timeBand.data.push(mockMetric);
        }

        timeBands.push(timeBand);

        mockNow = timeBandStart + mockTimeInterval * timeBands.length;
      }

      // the number of data points retained must match the number provided
      expect(metricsProvider)
        .to.be.an("object")
        .with.property("_metrics")
        .which.is.an("array")
        .that.has.lengthOf(mockMetrics.length);

      // now, examine each metric
      _.each(metricsProvider._metrics, function (value, index) {
        expect(value)
          .to.be.an("object")
          .with.property("metricA")
          .with.property("valueA")
          .that.equals(mockMetrics[index].metricA.valueA);

        expect(value)
          .to.be.an("object")
          .with.property("metricB")
          .with.property("valueA")
          .that.equals(mockMetrics[index].metricB.valueA);

        expect(value)
          .to.be.an("object")
          .with.property("metricB")
          .with.property("valueB")
          .that.equals(mockMetrics[index].metricB.valueB);
      });

      _.each(timeBands, function (value, index) {
        var averageA = {
          valueA: 0
        };

        var averageB = {
          valueA: 0,
          valueB: 0
        };

        var metricCount = value.endIndex - value.startIndex;

        // recompute the average manually
        _.each(value.data, function (metric) {
          if (metricCount === 0) {
            return;
          }

          averageA.valueA += metric.metricA.valueA / metricCount;

          averageB.valueA += metric.metricB.valueA / metricCount;
          averageB.valueB += metric.metricB.valueB / metricCount;
        });

        var row = metricsProvider._aggregation[AGGREGATE_TIME_LEVELS[0]].data[index];

        // the final row only becomes defined when a row after it (in time logic) appears
        // so it stands to reason that the final row will be undefined
        if (index >= metricsProvider._aggregation[AGGREGATE_TIME_LEVELS[0]].data.length) {
          expect(row).to.be.undefined;
        } else {
          // verify
          expect(row)
            .to.be.an("object")
            .with.property("metricA")
            .with.property("valueA")
            .which.is.a("number")
            .that.equals(+averageA.valueA.toFixed(1));

          expect(row)
            .to.be.an("object")
            .with.property("metricB")
            .with.property("valueA")
            .which.is.a("number")
            .that.equals(+averageB.valueA.toFixed(1));

          expect(row)
            .to.be.an("object")
            .with.property("metricB")
            .with.property("valueB")
            .which.is.a("number")
            .that.equals(+averageB.valueB.toFixed(1));
        }
      });
    }).timeout(10000);
  });

  describe("adjustZoomLevel", function () {
    it("allows for changing the zoom level", function () {
      // try to adjust the zoom right now
      metricsProvider.adjustZoomLevel(1);

      // there is no data, so it shouldn't change
      expect(metricsProvider)
        .to.be.an("object")
        .with.property("zoomLevel")
        .which.is.a("number")
        .that.equals(-1);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("zoomLevelKey")
        .that.is.undefined;

      // reset mock time
      mockTimeInterval = 2500;

      // reuse some mockMetrics above
      metricsProvider._onMetrics(mockMetrics[0]);  // 2500ms
      metricsProvider._onMetrics(mockMetrics[1]);  // 5000ms
      metricsProvider._onMetrics(mockMetrics[2]);  // 7500ms

      // given the uniform data, this should allow for one higher
      // aggregation
      metricsProvider.adjustZoomLevel(1);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("zoomLevel")
        .which.is.a("number")
        .that.equals(0);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("zoomLevelKey")
        .which.is.a("string")
        .that.equals(AGGREGATE_TIME_LEVELS[0]);

      // zooming again should have no change
      metricsProvider.adjustZoomLevel(1);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("zoomLevel")
        .which.is.a("number")
        .that.equals(0);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("zoomLevelKey")
        .which.is.a("string")
        .that.equals(AGGREGATE_TIME_LEVELS[0]);

      // getting metrics should come from the aggregate now
      var metrics = metricsProvider.getMetrics(3);

      expect(metrics)
        .to.be.an("array")
        .that.deep.equals(metricsProvider._aggregation[metricsProvider.zoomLevelKey].data);

      // receiving metrics now would cause an emit
      sandbox.stub(metricsProvider, "emit", function (key, data, discardEvent) {
        if (discardEvent) {
          return;
        }

        expect(key)
          .to.be.a("string")
          .that.equals("metrics");

        expect(data)
          .to.be.an("object")
          .that.deep.equals(
            _.last(metricsProvider._aggregation[metricsProvider.zoomLevelKey].data)
          );
      });

      metricsProvider._onMetrics(mockMetrics[3]);

      // if time were to be skipped, some missing time slots should be generated too
      metricsProvider._onMetrics(mockMetrics[4]);

      // advance the time a few slots
      mockNow += mockTimeInterval * 10;

      metricsProvider._onMetrics(mockMetrics[4]);
      metricsProvider._onMetrics(mockMetrics[5]);
      metricsProvider._onMetrics(mockMetrics[6]);
    });
  });

  describe("getXAxis", function () {
    it("should return labels appropriate for their highest measure of time", function () {
      var limit = 10;
      var axis = metricsProvider.getXAxis(limit);

      var expected =
        _.reverse([":00", ":01", ":02", ":03", ":04", ":05", ":06", ":07", ":08", ":09"]);

      expect(axis)
        .to.be.an("array")
        .that.deep.equals(expected);

      // lets get some aggregation for another zoom level
      _.each(_.slice(mockMetrics, 0, 100), function (value) {
        metricsProvider._onMetrics(value);
      });

      // zoom
      metricsProvider.adjustZoomLevel(2);

      axis = metricsProvider.getXAxis(limit);
      expected =
        _.reverse([":00", ":10", ":20", ":30", ":40", ":50", "1:00", "1:10", "1:20", "1:30"]);

      expect(axis)
        .to.be.an("array")
        .that.deep.equals(expected);

      // override zoom (hours)
      metricsProvider.zoomLevelKey = _.last(AGGREGATE_TIME_LEVELS);

      // there are 8,760 hours in a day, getting an axis of 10,000 will get us full coverage
      axis = metricsProvider.getXAxis(10000);

      // here is the expected (use 9999 not 10000 because the last axis element is zero-based)
      var years = Math.floor(metricsProvider.zoomLevelKey * 9999 / (1000 * 60 * 60 * 24 * 365.25));
      var days = Math.floor(metricsProvider.zoomLevelKey * 9999 / (1000 * 60 * 60 * 24) % 365.25);
      var hours = Math.floor(metricsProvider.zoomLevelKey * 9999 / (1000 * 60 * 60) % 24);
      var minutes = Math.floor(metricsProvider.zoomLevelKey * 9999 / (1000 * 60) % 60);
      var seconds = Math.floor(metricsProvider.zoomLevelKey * 9999 / 1000 % 60);

      // build a label
      var label =
        years + "y"
        + days + "d "
        + hours + ":"
        + _.padStart(minutes, 2, "0") + ":"
        + _.padStart(seconds, 2, "0");

      expect(axis[0])
        .to.be.a("string")
        .that.equals(label);
    });
  });
});
