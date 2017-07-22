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
  var mockStart = 1000000;
  var mockNow = 1000000;
  var mockTimeInterval = 2500;

  var metricsRequiredToAchieveHighestAggregation =
    +AGGREGATE_TIME_LEVELS.slice(-1)[0] / mockTimeInterval;

  var mockMetrics = [];
  var mockMetricCount;

  before(function (done) {
    sandbox = sinon.sandbox.create();

    // generate some fake metrics for processing
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

    done();
  });

  after(function (done) {
    done();
  });

  beforeEach(function (done) {
    mockNow = mockStart;

    stubNow = sinon.stub(Date, "now", function () {
      mockNow += mockTimeInterval;
      return mockNow - mockTimeInterval;
    });

    testContainer = utils.getTestContainer(sandbox);
    metricsProvider = new MetricsProvider(testContainer.screen);

    done();
  });

  afterEach(function (done) {
    stubNow.restore();
    sandbox.restore();

    done();
  });

  describe("constructor", function () {
    it("builds an aggregation container from configuration", function (done) {
      expect(metricsProvider).to.be.an.instanceOf(MetricsProvider);

      expect(Object.keys(metricsProvider._aggregation)).to.deep.equal(AGGREGATE_TIME_LEVELS);

      var index = 0;
      _.each(metricsProvider._aggregation, function (value, key) {
        expect(key)
          .to.be.a("string")
          .that.equals(AGGREGATE_TIME_LEVELS[index++]);

        expect(value)
          .to.be.an("object")
          .that.deep.equals({
            data: [],
            lastIndex: 0,
            nextAggregateIndex: 0
          });
      });

      expect(metricsProvider.aggregationLevels)
        .to.be.an("array")
        .that.deep.equals(AGGREGATE_TIME_LEVELS);

      expect(metricsProvider.minimumAggregationInterval)
        .to.be.a("number")
        .that.equals(+AGGREGATE_TIME_LEVELS[0]);

      expect(metricsProvider.highestAggregationKey)
        .to.be.a("string")
        .that.equals(AGGREGATE_TIME_LEVELS.slice(-1)[0]);

      expect(metricsProvider.zoomLevel)
        .to.be.a("number")
        .that.equals(-1);

      expect(metricsProvider.zoomLevelKey).to.be.undefined;

      expect(metricsProvider._startTime)
        .to.be.a("number")
        .that.equals(mockStart);

      expect(metricsProvider._lastAggregation)
        .to.be.a("number")
        .that.equals(mockStart);

      expect(metricsProvider._metrics)
        .to.be.an("array")
        .that.deep.equals([]);

      done();
    });
  });

  describe("_onMetrics", function () {
    // due to the quantity of data processed, notice the .timeout at the bottom - this allows
    // for a longer running test
    it("retains metrics received, while aggregating them into time buckets", function (done) {
      // load with mock metric data already computed
      _.each(mockMetrics, function (value) {
        metricsProvider._onMetrics(value);
      });

      // the number of data points retained must match the number provided
      expect(metricsProvider._metrics)
        .to.be.an("array")
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

        // verify the memory deallocation logic is working
        if (index < metricsRequiredToAchieveHighestAggregation - 1) {
          expect(value)
            .to.not.have.property("__timeIndices");
        }

        // for those that are not deallocated, verify those properties
        if (index >= metricsRequiredToAchieveHighestAggregation - 1) {
          expect(value)
            .to.have.property("__timeIndices");

          _.each(AGGREGATE_TIME_LEVELS, function (level) {
            // reverse-engineer the expected time index
            var timeIndex = Math.floor((index + 1) * mockTimeInterval / +level);

            expect(value)
              .to.be.an("object")
              .with.property("__timeIndices")
              .with.property(level)
              .to.be.a("number")
              .that.equals(timeIndex);
          });
        }
      });

      _.each(metricsProvider._aggregation, function (value, key) {
        _.each(value.data, function (row, index) {
          var startTimeBand = index * Math.floor(+key / mockTimeInterval) - 1;
          var endTimeBand = startTimeBand + Math.floor(+key / mockTimeInterval);

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

          _.each(metricsProvider._metrics.slice(startTimeBand, endTimeBand), function (metric) {
            averageA.valueA += metric.metricA.valueA / (endTimeBand - startTimeBand);

            averageB.valueA += metric.metricB.valueA / (endTimeBand - startTimeBand);
            averageB.valueB += metric.metricB.valueB / (endTimeBand - startTimeBand);
          });

          expect(row)
            .to.be.an("object")
            .with.property("metricA")
            .with.property("valueA")
            .that.is.a("number")
            .that.equals(+averageA.valueA.toFixed(1));

          expect(row)
            .to.be.an("object")
            .with.property("metricB")
            .with.property("valueA")
            .that.is.a("number")
            .that.equals(+averageB.valueA.toFixed(1));

          expect(row)
            .to.be.an("object")
            .with.property("metricB")
            .with.property("valueB")
            .that.is.a("number")
            .that.equals(+averageB.valueB.toFixed(1));
        });
      });

      done();
    }).timeout(10000);
  });
});
