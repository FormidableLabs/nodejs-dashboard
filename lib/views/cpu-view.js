"use strict";

var _ = require("lodash");
var BaseLineGraph = require("./base-line-graph");


var CpuView = function CpuView(options) {
  BaseLineGraph.call(this, _.merge({
    label: "cpu utilization",
    unit: "%",
    maxY: 100
  }, options));
};

CpuView.prototype = Object.create(BaseLineGraph.prototype);

CpuView.prototype.onEvent = function (data) {
  this.update(data.cpu.utilization.toFixed(1));
};

module.exports = CpuView;
