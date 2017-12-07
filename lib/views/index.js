"use strict";

var StreamView = require("./stream-view");
var EventLoopView = require("./eventloop-view");
var MemoryGaugeView = require("./memory-gauge-view");
var MemoryGraphView = require("./memory-graph-view");
var CpuView = require("./cpu-view");
var BaseView = require("./base-view");

var VIEW_MAP = {
  log: StreamView,
  cpu: CpuView,
  memory: MemoryGaugeView,
  memoryGraph: MemoryGraphView,
  eventLoop: EventLoopView
};

var getConstructor = function (options) {
  if (VIEW_MAP[options.type]) {
    return VIEW_MAP[options.type];
  } else if (options.module) {
    // eslint-disable-next-line global-require
    return require(options.module)(BaseView);
  }
  return null;
};

module.exports = {
  getConstructor: getConstructor
};
