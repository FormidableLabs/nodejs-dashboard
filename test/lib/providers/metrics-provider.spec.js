/* eslint-disable max-statements,no-magic-numbers,max-nested-callbacks */

"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");
const _ = require("lodash");

const AGGREGATE_TIME_LEVELS = require("../../../lib/constants").AGGREGATE_TIME_LEVELS;

const utils = require("../../utils");
const MetricsProvider = require("../../../lib/providers/metrics-provider");


const createMockMetric = function () {
  return {
    metricA: {
      valueA: Math.random() * 100
    },
    metricB: {
      valueA: Math.random() * 100,
      valueB: Math.random() * 100
    }
  };
};

const mapToAverage = function (metric) {
  return {
    metricA: {
      valueA: Number(metric.metricA.valueA.toFixed(1))
    },
    metricB: {
      valueA: Number(metric.metricB.valueA.toFixed(1)),
      valueB: Number(metric.metricB.valueB.toFixed(1))
    }
  };
};

describe("MetricsProvider", () => {
  let sandbox;
  let testContainer;
  let metricsProvider;

  let mockStart;
  let mockNow;
  let fill;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    mockStart = 10000000;
    mockNow = mockStart;
    sandbox.stub(Date, "now").callsFake(() => mockNow);

    fill = function (count, interval) {
      const mockData = [];
      for (let i = 0; i < count; ++i) {
        mockNow += interval;
        const mockMetric = createMockMetric();
        metricsProvider._onMetrics(mockMetric);
        mockData.push(mockMetric);
      }
      return mockData;
    };

    testContainer = utils.getTestContainer(sandbox);
    metricsProvider = new MetricsProvider(testContainer.screen);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("constructor", () => {
    it("builds an aggregation container from configuration", () => {
      expect(metricsProvider).to.be.an.instanceOf(MetricsProvider);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("_aggregation")
        .which.is.an("object")
        .with.keys(AGGREGATE_TIME_LEVELS);

      let index = 0;
      _.each(metricsProvider._aggregation, (value, key) => {
        expect(key)
          .to.be.a("string")
          .that.equals(AGGREGATE_TIME_LEVELS[index++]);

        expect(value)
          .to.be.an("object")
          .that.deep.equals({
            data: [],
            lastTimeIndex: undefined,
            lastAggregateIndex: 0,
            scrollOffset: 0
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
        .that.equals(0);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("zoomLevelKey")
        .which.is.a("string")
        .that.equals(AGGREGATE_TIME_LEVELS[0]);

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

  describe("_onMetrics", () => {
    it("retains metrics received", () => {
      // create some mock data
      const mockMetrics = fill(10, 500);

      // the number of data points retained must match the number provided
      expect(metricsProvider)
        .to.be.an("object")
        .with.property("_metrics")
        .which.is.an("array")
        .that.has.lengthOf(mockMetrics.length);

      // now, examine each metric
      _.each(metricsProvider._metrics, (value, index) => {
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
    });

    it("creates missing average even if first", () => {
      const timeKey = AGGREGATE_TIME_LEVELS[0];
      const timeLength = Number(timeKey);

      // Fill 2 time slots skiping the first
      // 2 slots are needed to cause average calculation
      const mockMetrics = fill(2, timeLength);

      expect(metricsProvider._aggregation[timeKey].data)
        .to.be.an("array")
        .that.eql([
          {
            metricA: {
              valueA: 0
            },
            metricB: {
              valueA: 0,
              valueB: 0
            }
          },
          mapToAverage(mockMetrics[0])
        ]);
    });

    it("creates missing average in the middle", () => {
      const timeKey = AGGREGATE_TIME_LEVELS[0];
      const timeLength = Number(timeKey);

      // Fill data until first average created
      let mockMetrics = fill(2, timeLength - 1);

      // Then add 1 more metric to split lastTimeIndex from lastAggregateIndex
      mockMetrics = mockMetrics.concat(fill(1, timeLength * 2));

      // Then skip a time slot and add 1 more metric
      mockMetrics = mockMetrics.concat(fill(1, timeLength * 3));

      expect(metricsProvider._aggregation[timeKey].data)
        .to.be.an("array")
        .that.eql([
          mapToAverage(mockMetrics[0]),
          mapToAverage(mockMetrics[1]),
          {
            metricA: {
              valueA: 0
            },
            metricB: {
              valueA: 0,
              valueB: 0
            }
          },
          mapToAverage(mockMetrics[2])
        ]);
    });

    it("aggregates metrics into time buckets", () => {
      // Fill in a single event so all future events result in a average calculation
      let mockMetrics = fill(1, 1);

      // Add an event at the 2nd time slot of the largest bucket
      // This will cause an average calculation for all buckets
      const maxZoomLevel = Number(AGGREGATE_TIME_LEVELS[AGGREGATE_TIME_LEVELS.length - 1]);
      mockMetrics = mockMetrics.concat(fill(1, maxZoomLevel));

      // The 2nd event filled all average buckets with the first event
      // Since there is only 1 event the average is the same values
      _.each(metricsProvider._aggregation, (value) => {
        expect(value.data)
          .to.be.an("array")
          .that.has.lengthOf(1);

        const row = value.data[0];
        const lastMock = mockMetrics[0];
        const averageA = lastMock.metricA;
        const averageB = lastMock.metricB;

        // verify
        expect(row)
          .to.be.an("object")
          .with.property("metricA")
          .with.property("valueA")
          .which.is.a("number")
          .that.equals(Number(averageA.valueA.toFixed(1)));

        expect(row)
          .to.be.an("object")
          .with.property("metricB")
          .with.property("valueA")
          .which.is.a("number")
          .that.equals(Number(averageB.valueA.toFixed(1)));

        expect(row)
          .to.be.an("object")
          .with.property("metricB")
          .with.property("valueB")
          .which.is.a("number")
          .that.equals(Number(averageB.valueB.toFixed(1)));
      });
    });
  });

  describe("adjustZoomLevel", () => {
    it("allows for changing the zoom level", () => {
      // try to adjust the zoom right now
      metricsProvider.adjustZoomLevel(1);

      // there is no data, so it shouldn't change
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

      // add some mock data
      fill(2, 2500);

      // given the uniform data, this should allow for one higher
      // aggregation
      metricsProvider.adjustZoomLevel(1);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("zoomLevel")
        .which.is.a("number")
        .that.equals(1);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("zoomLevelKey")
        .which.is.a("string")
        .that.equals(AGGREGATE_TIME_LEVELS[1]);

      // zooming again should have no change
      metricsProvider.adjustZoomLevel(1);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("zoomLevel")
        .which.is.a("number")
        .that.equals(1);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("zoomLevelKey")
        .which.is.a("string")
        .that.equals(AGGREGATE_TIME_LEVELS[1]);

      // getting metrics should come from the aggregate now
      const metrics = metricsProvider.getMetrics(3);

      expect(metrics)
        .to.be.an("array")
        .that.deep.equals(metricsProvider._aggregation[metricsProvider.zoomLevelKey].data);

      // receiving metrics now would cause an emit
      sandbox.stub(metricsProvider, "emit").callsFake((key, data, discardEvent) => {
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

      fill(1, 7500);

      // if time were to be skipped, some missing time slots should be generated too
      fill(3, 25000);
    });
  });

  describe("getXAxis", () => {
    it("should return labels appropriate for their highest measure of time", () => {
      const limit = 10;
      let axis = metricsProvider.getXAxis(limit);

      let expected
        = _.reverse([":00", ":01", ":02", ":03", ":04", ":05", ":06", ":07", ":08", ":09"]);

      expect(axis)
        .to.be.an("array")
        .that.deep.equals(expected);

      // lets get some aggregation for another zoom level
      fill(100, 500);

      // zoom
      metricsProvider.adjustZoomLevel(2);

      axis = metricsProvider.getXAxis(limit);
      expected
        = _.reverse([":00", ":10", ":20", ":30", ":40", ":50", "1:00", "1:10", "1:20", "1:30"]);

      expect(axis)
        .to.be.an("array")
        .that.deep.equals(expected);

      // max zoom
      metricsProvider.setZoomLevel(AGGREGATE_TIME_LEVELS.length);

      // there are 8,760 hours in a day, getting an axis of 10,000 will get us full coverage
      axis = metricsProvider.getXAxis(10000);

      // here is the expected (use 9999 not 10000 because the last axis element is zero-based)
      const { zoomLevelKey } = metricsProvider;
      const years = Math.floor(zoomLevelKey * 9999 / (1000 * 60 * 60 * 24 * 365.25));
      const days = Math.floor(zoomLevelKey * 9999 / (1000 * 60 * 60 * 24) % 365.25);
      const hours = Math.floor(zoomLevelKey * 9999 / (1000 * 60 * 60) % 24);
      const minutes = Math.floor(zoomLevelKey * 9999 / (1000 * 60) % 60);
      const seconds = Math.floor(zoomLevelKey * 9999 / 1000 % 60);

      // build a label
      const label
        = `${years}y${
          days}d ${
          hours}:${
          _.padStart(minutes, 2, "0")}:${
          _.padStart(seconds, 2, "0")}`;

      expect(axis[0])
        .to.be.a("string")
        .that.equals(label);
    });
  });

  describe("adjustScrollOffset", () => {
    it("adjusts the scroll either relative or absolute", () => {
      // add some data
      fill(1, 0);
      fill(1, 500);

      // go left one
      metricsProvider.adjustScrollOffset(-1);

      // should be offset one
      expect(metricsProvider)
        .to.be.an("object")
        .with.property("_aggregation")
        .with.property(metricsProvider.zoomLevelKey)
        .which.is.an("object")
        .with.property("scrollOffset")
        .which.is.a("number")
        .that.equals(-1);

      // go forward two
      metricsProvider.adjustScrollOffset(+2);

      // won't go above zero
      expect(metricsProvider)
        .to.be.an("object")
        .with.property("_aggregation")
        .with.property(metricsProvider.zoomLevelKey)
        .which.is.an("object")
        .with.property("scrollOffset")
        .which.is.a("number")
        .that.equals(0);

      metricsProvider.adjustScrollOffset(-5);

      // add some more data to verify that scroll offset adjusts
      // 50 more elements at lowest time interval is 50 more aggregates
      fill(50, Number(AGGREGATE_TIME_LEVELS[0]));

      // previous offset should be adjusted by the number of additional aggregate
      // elements
      expect(metricsProvider)
        .to.be.an("object")
        .with.property("_aggregation")
        .with.property(metricsProvider.zoomLevelKey)
        .which.is.an("object")
        .with.property("scrollOffset")
        .which.is.a("number")
        .that.equals(-55);

      // test out absolute position
      metricsProvider.adjustScrollOffset(-1, true);

      // should be offset one
      expect(metricsProvider)
        .to.be.an("object")
        .with.property("_aggregation")
        .with.property(metricsProvider.zoomLevelKey)
        .which.is.an("object")
        .with.property("scrollOffset")
        .which.is.a("number")
        .that.equals(-1);

      // reset
      metricsProvider.resetGraphs();

      // now try to go way left
      metricsProvider.adjustScrollOffset(-5000);

      // should be offset
      expect(metricsProvider)
        .to.be.an("object")
        .with.property("_aggregation")
        .with.property(metricsProvider.zoomLevelKey)
        .which.is.an("object")
        .with.property("scrollOffset")
        .which.is.a("number")
        .that.equals(-5000);

      // getting metrics now will correct the offset considering limit
      metricsProvider.getMetrics(30);

      expect(metricsProvider)
        .to.be.an("object")
        .with.property("_aggregation")
        .with.property(metricsProvider.zoomLevelKey)
        .which.is.an("object")
        .with.property("scrollOffset")
        .which.is.a("number")
        .that.equals(30 - metricsProvider._aggregation[AGGREGATE_TIME_LEVELS[0]].data.length);
    });
  });

  describe("startGraphs", () => {
    it("offsets at the end or the beginning of the data set", () => {
      // load some data
      fill(100, 500);

      sandbox.stub(metricsProvider, "adjustScrollOffset").callsFake((direction) => {
        let length = metricsProvider._aggregation[AGGREGATE_TIME_LEVELS[0]].data.length;

        length = direction < 0 ? -length : Number(length);

        expect(direction)
          .to.be.a("number")
          .that.equals(length);
      });

      metricsProvider.startGraphs(-1);
      metricsProvider.startGraphs(+1);
    });
  });

  describe("resetGraphs", () => {
    it("resets zoom level and scroll offsets", () => {
      sandbox.stub(metricsProvider, "setZoomLevel").callsFake((zoom) => {
        expect(zoom)
          .to.be.a("number")
          .that.equals(0);
      });

      _.each(AGGREGATE_TIME_LEVELS, (level) => {
        expect(metricsProvider)
          .to.be.an("object")
          .with.property("_aggregation")
          .which.is.an("object")
          .with.property(level)
          .which.is.an("object")
          .with.property("scrollOffset")
          .which.is.a("number")
          .that.equals(0);
      });

      metricsProvider.resetGraphs();
    });
  });
});
