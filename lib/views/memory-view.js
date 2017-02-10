"use strict";

var blessed = require("blessed");
var contrib = require("blessed-contrib");
var prettyBytes = require("pretty-bytes");
var util = require("util");

var MemoryView = function MemoryView(options) {
  this.options = options;

  this.memoryFrame = blessed.box({
    label: " memory ",
    border: {
      type: "line"
    },
    style: {
      line: "yellow",
      text: "green",
      baseline: "black",
      border: {
        fg: "cyan"
      }
    },
    showLabel: true,
    position: options.getPosition(options.index, options.parent)
  });

  this.heapGauge = contrib.gauge({
    style: {
      line: "yellow",
      text: "green",
      baseline: "black"
    },
    showLabel: true
  });

  this.heapText = blessed.text({
    content: "",
    padding: {
      left: 1
    }
  });

  this.rssText = blessed.text({
    content: "",
    top: "50%",
    padding: {
      left: 1
    }
  });

  this.rssGauge = contrib.gauge({
    style: {
      line: "yellow",
      text: "green",
      baseline: "black"
    },
    top: "55%",
    showLabel: true
  });

  options.parent.on("resize", this._onResize.bind(this));

  this.memoryFrame.append(this.heapGauge);
  this.memoryFrame.append(this.heapText);
  this.memoryFrame.append(this.rssGauge);
  this.memoryFrame.append(this.rssText);

  options.parent.append(this.memoryFrame);
};

MemoryView.prototype._onResize = function () {
  var options = this.options;

  options.parent.remove(this.memoryFrame);
  this.memoryFrame.position = options.getPosition(options.index, options.parent);
  options.parent.append(this.memoryFrame);
};

MemoryView.prototype._usageText = function (label, used, total) {
  return util.format("%s: %s / %s", label, prettyBytes(used), prettyBytes(total));
};

MemoryView.prototype._stackedPercents = function (used, total) {
  var usedPercent = Math.floor(used / total * 100.0); //eslint-disable-line no-magic-numbers
  var remainingPercent = 100 - usedPercent; //eslint-disable-line no-magic-numbers

  return { usedPercent: usedPercent, remainingPercent: remainingPercent };
};

MemoryView.prototype.onEvent = function (data) {

  var mem = data.mem;
  var heapMetrics = this._stackedPercents(mem.heapUsed, mem.heapTotal);
  var rssMetrics = this._stackedPercents(mem.rss, mem.systemTotal);

  this.heapGauge.setStack([
    { percent: heapMetrics.usedPercent, stroke: "red" },
    { percent: heapMetrics.remainingPercent, stroke: "blue" }
  ]);

  this.heapText.setContent(this._usageText("heap usage", mem.heapUsed, mem.heapTotal));

  this.rssGauge.setPercent(rssMetrics.usedPercent);
  this.rssText.setContent(this._usageText("resident", mem.rss, mem.systemTotal));
};

module.exports = MemoryView;
