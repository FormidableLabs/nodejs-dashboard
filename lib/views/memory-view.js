"use strict";

var blessed = require("blessed");
var contrib = require("blessed-contrib");
var prettyBytes = require("pretty-bytes");
var util = require("util");

var BaseView = require("./base-view");

var MAX_PERCENT = 100;

var MemoryView = function MemoryView(options) {
  BaseView.call(this, options);

  this.node = blessed.box({
    label: " memory ",
    position: this.getPosition(),
    border: "line",
    style: {
      border: {
        fg: "cyan"
      }
    }
  });

  this.heapGauge = contrib.gauge({ label: "heap" });
  this.node.append(this.heapGauge);

  this.rssGauge = contrib.gauge({ label: "resident", top: "50%" });
  this.node.append(this.rssGauge);

  options.parent.append(this.node);
  options.parent.screen.on("metrics", this.onEvent.bind(this));
};

MemoryView.prototype = Object.create(BaseView.prototype);

MemoryView.prototype.onEvent = function (data) {
  var mem = data.mem;
  this.update(this.heapGauge, mem.heapUsed, mem.heapTotal);
  this.update(this.rssGauge, mem.rss, mem.systemTotal);
};

MemoryView.prototype.update = function (gauge, used, total) {
  var percentUsed = Math.floor(used / total * MAX_PERCENT);
  if (gauge === this.heapGauge) {
    gauge.setStack([
      { percent: percentUsed, stroke: "red" },
      { percent: MAX_PERCENT - percentUsed, stroke: "blue" }
    ]);
  } else {
    gauge.setPercent(percentUsed);
  }

  gauge.setLabel(
    util.format("%s: %s / %s", gauge.options.label, prettyBytes(used), prettyBytes(total))
  );
};

module.exports = MemoryView;
