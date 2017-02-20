"use strict";

var _ = require("lodash");
var BaseLineGraph = require("./base-line-graph");

var EventLoopView = function EventLoopView(options) {
  BaseLineGraph.call(this, _.merge({
    highwater: true,
    unit: "ms",
    series: {
      delay: {},
      high: { highwater: true }
    }
  }, options));
};

EventLoopView.prototype = Object.create(BaseLineGraph.prototype);

EventLoopView.prototype.getDefaultLayoutConfig = function (options) {
  return {
    borderColor: "cyan",
    title: "event loop",
    limit: 30
  };
};

EventLoopView.prototype.onEvent = function (data) {
  this.update({
    delay: data.eventLoop.delay,
    high: data.eventLoop.high
  });
};

module.exports = EventLoopView;
