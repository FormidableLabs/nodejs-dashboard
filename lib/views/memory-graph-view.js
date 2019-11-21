"use strict";

const _ = require("lodash");

const BaseLineGraph = require("./base-line-graph");
const utils = require("../utils");

const MemoryGraphView = function MemoryGraphView(options) {
  BaseLineGraph.call(this, _.merge({
    unit: "%",
    maxY: 100,
    series: {
      heap: { color: "green" },
      resident: {}
    }
  }, options));
};

MemoryGraphView.prototype = Object.create(BaseLineGraph.prototype);

MemoryGraphView.prototype.getDefaultLayoutConfig = function () {
  return {
    borderColor: "cyan",
    title: "memory",
    limit: 30
  };
};

// discardEvent is needed so that the memory guage view can be
// updated real-time while some graphs are aggregate data
MemoryGraphView.prototype.onEvent = function (data, discardEvent) {
  const mem = data.mem;
  if (discardEvent) {
    return;
  }
  this.update({
    heap: utils.getPercentUsed(mem.heapUsed, mem.heapTotal),
    resident: utils.getPercentUsed(mem.rss, mem.systemTotal)
  });
};

MemoryGraphView.prototype.onRefreshMetrics = function () {
  const mapper = function mapper(rows) {
    return _.map(rows, (row) => ({
      heap: utils.getPercentUsed(row.mem.heapUsed, row.mem.heapTotal),
      resident: utils.getPercentUsed(row.mem.rss, row.mem.systemTotal)
    }));
  };

  this.refresh(mapper);
};

module.exports = MemoryGraphView;
