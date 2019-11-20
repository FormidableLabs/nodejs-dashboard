"use strict";

const _ = require("lodash");
const BaseLineGraph = require("./base-line-graph");

const CpuView = function CpuView(options) {
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
  const mapper = function mapper(rows) {
    return _.map(rows, (row) => ({ cpu: Number(row.cpu.utilization.toFixed(1)) }));
  };

  this.refresh(mapper);
};

module.exports = CpuView;
