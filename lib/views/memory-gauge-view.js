"use strict";

const assert = require("assert");
const blessed = require("blessed");
const contrib = require("blessed-contrib");
const prettyBytes = require("pretty-bytes");
const util = require("util");

const BaseView = require("./base-view");
const utils = require("../utils");

const MAX_PERCENT = 100;

const MemoryView = function MemoryView(options) {
  BaseView.call(this, options);

  assert(options.metricsProvider, "View requires metricsProvider");

  this.metricsProvider = options.metricsProvider;

  this._remountOnResize = true;
  this._boundOnEvent = this.onEvent.bind(this);

  this._createViews(options);

  options.metricsProvider.on("metrics", this._boundOnEvent);

  const metrics = this.metricsProvider.getMetrics(1)[0];

  if (metrics) {
    this.onEvent(metrics);
  }
};

MemoryView.prototype = Object.create(BaseView.prototype);

MemoryView.prototype.getDefaultLayoutConfig = function () {
  return {
    borderColor: "cyan",
    title: "memory"
  };
};

MemoryView.prototype._createViews = function (options) {
  this.node = blessed.box({
    label: util.format(" %s ", this.layoutConfig.title),
    border: "line",
    style: {
      border: {
        fg: this.layoutConfig.borderColor
      }
    }
  });

  this.recalculatePosition();

  this.heapGauge = contrib.gauge({ label: "heap" });
  this.node.append(this.heapGauge);

  this.rssGauge = contrib.gauge({ label: "resident",
    top: "50%" });
  this.node.append(this.rssGauge);

  options.parent.append(this.node);
};

MemoryView.prototype.onEvent = function (data) {
  const mem = data.mem;
  this.update(this.heapGauge, mem.heapUsed, mem.heapTotal);
  this.update(this.rssGauge, mem.rss, mem.systemTotal);
};

MemoryView.prototype.update = function (gauge, used, total) {
  const percentUsed = utils.getPercentUsed(used, total);
  if (gauge === this.heapGauge) {
    gauge.setStack([
      { percent: percentUsed,
        stroke: "red" },
      { percent: MAX_PERCENT - percentUsed,
        stroke: "blue" }
    ]);
  } else {
    gauge.setPercent(percentUsed);
  }

  gauge.setLabel(
    util.format("%s: %s / %s", gauge.options.label, prettyBytes(used), prettyBytes(total))
  );
};

MemoryView.prototype.destroy = function () {
  BaseView.prototype.destroy.call(this);

  this.metricsProvider.removeListener("metrics", this._boundOnEvent);

  this._boundOnEvent = null;
  this.metricsProvider = null;
};

module.exports = MemoryView;
