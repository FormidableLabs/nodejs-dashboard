"use strict";

const _ = require("lodash");
const BaseLineGraph = require("./base-line-graph");

const EventLoopView = function EventLoopView(options) {
  BaseLineGraph.call(this, _.merge({
    unit: "ms",
    series: {
      delay: {},
      high: { highwater: true }
    }
  }, options));
};

EventLoopView.prototype = Object.create(BaseLineGraph.prototype);

EventLoopView.prototype.getDefaultLayoutConfig = function () {
  return {
    borderColor: "cyan",
    title: "event loop",
    limit: 30
  };
};

// discardEvent is needed so that the memory guage view can be
// updated real-time while some graphs are aggregate data
EventLoopView.prototype.onEvent = function (data, discardEvent) {
  if (discardEvent) {
    return;
  }
  this.update({
    delay: data.eventLoop.delay,
    high: data.eventLoop.high
  });
};

EventLoopView.prototype.onRefreshMetrics = function () {
  const mapper = function mapper(rows) {
    const filter = function filter() {
      return _.reduce(rows, (prev, curr) => Math.max(prev, curr.eventLoop.high), 0);
    };

    const maxDelay = filter();

    return _.map(rows, (row) => ({
      delay: Number(row.eventLoop.delay.toFixed(1)),
      high: Number(maxDelay.toFixed(1))
    }));
  };

  this.refresh(mapper);
};

module.exports = EventLoopView;
