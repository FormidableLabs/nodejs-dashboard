"use strict";

var contrib = require("blessed-contrib");
var util = require("util");
var _ = require("lodash");


var CpuView = function CpuView(options) {
  this.historyDepth = 10;
  this.cpuHistory = _.times(this.historyDepth, _.constant(0));
  this.options = options;

  this.line = contrib.line({
    label: " cpu utilization ",
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
    numYLabels: 4,
    maxY: 100,
    showLegend: false,
    wholeNumbersOnly: true,
    position: options.getPosition(options.index, options.parent)
  });

  this.cpuStats = {
    title: "utilization",
    x: _.reverse(_.times(this.historyDepth, String)),
    y: this.cpuHistory
  };

  options.parent.on("resize", this._onResize.bind(this));

  options.parent.append(this.line);
  this.line.setData(this.cpuStats);
};

CpuView.prototype._onResize = function () {
  var options = this.options;

  options.parent.remove(this.line);
  this.line.position = options.getPosition(options.index, options.parent);
  options.parent.append(this.line);
};

CpuView.prototype.onEvent = function (data) {

  this.line.setLabel(util.format(" cpu utilization (%s) ", data.cpu.utilization.toFixed(1)));
  this.cpuHistory.push(data.cpu.utilization);

  if (this.cpuHistory.length > this.historyDepth) {
    this.cpuHistory.shift();
  }

  this.line.setData([this.cpuStats]);
};


module.exports = CpuView;
