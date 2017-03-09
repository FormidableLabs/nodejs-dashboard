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

EventLoopView.prototype.getDefaultLayoutConfig = function (options) {
  return {
    borderColor: "cyan",
    title: options.highwater ?
      "event loop delay ({value}), high ({high})" : "event loop delay ({value})",
    limit: 30
  };
};

EventLoopView.prototype.onEvent = function (data) {
  this.update(data.eventLoop.delay, data.eventLoop.high);
};

module.exports = EventLoopView;
