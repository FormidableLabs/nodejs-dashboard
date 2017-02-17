"use strict";

var _ = require("lodash");
var BaseLineGraph = require("./base-line-graph");

var EventLoopView = function EventLoopView(options) {
  BaseLineGraph.call(this, _.merge({
    highwater: true,
    unit: "ms"
  }, options));
};

EventLoopView.prototype = Object.create(BaseLineGraph.prototype);

EventLoopView.prototype.getDefaultLayoutConfig = function () {
  return {
    borderColor: "cyan",
    title: "event loop delay",
    limit: 30
  };
};

EventLoopView.prototype.onEvent = function (data) {
  this.update(data.eventLoop.delay, data.eventLoop.high);
};

module.exports = EventLoopView;
