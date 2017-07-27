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

// discardEvent is needed so that the memory guage view can be
// updated real-time while some graphs are aggregate data
CpuView.prototype.onEvent = function (data, discardEvent) {
  if (discardEvent) {
    return;
  }
  this.update({ cpu: data.cpu.utilization.toFixed(1) });
};

CpuView.prototype.onRefreshMetrics = function () {
  var mapper = function mapper(rows) {
    return _.map(rows, function (row) {
      return { cpu: +row.cpu.utilization.toFixed(1) };
    });
  };

  this.refresh(mapper);
};

module.exports = CpuView;
