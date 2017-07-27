"use strict";

var _ = require("lodash");
var BaseLineGraph = require("./base-line-graph");

var EventLoopView = function EventLoopView(options) {
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
  var mapper = function mapper(rows) {
    var filter = function filter() {
      return _.reduce(rows, function (prev, curr) {
        return Math.max(prev, curr.eventLoop.high);
      }, 0);
    };

    var maxDelay = filter();

    return _.map(rows, function (row) {
      return {
        delay: +row.eventLoop.delay.toFixed(1),
        high: +maxDelay.toFixed(1)
      };
    });
  };

  this.refresh(mapper);
};

module.exports = EventLoopView;
