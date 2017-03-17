"use strict";

var _ = require("lodash");
var BaseLineGraph = require("./base-line-graph");

var CpuView = function CpuView(options) {
  BaseLineGraph.call(this, _.merge({
    unit: "%",
    maxY: 100,
    series: {
      cpu: { label: "" }
    }
  }, options));
};

CpuView.prototype = Object.create(BaseLineGraph.prototype);

CpuView.prototype.getDefaultLayoutConfig = function () {
  return {
    borderColor: "cyan",
    title: "cpu utilization",
    limit: 30
  };
};

CpuView.prototype.onEvent = function (data) {
  this.update({ cpu: data.cpu.utilization.toFixed(1) });
};

module.exports = CpuView;
