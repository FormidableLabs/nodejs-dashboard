"use strict";

var contrib = require("blessed-contrib");
var util = require("util");
var _ = require("lodash");

var EventLoopView = function EventLoopView(options) {
  this.historyDepth = 10;
  this.eventLoopHistory = _.times(this.historyDepth, _.constant(0));
  this.options = options;

  this.line = contrib.line({
    label: " event loop delay ",
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
    showLegend: false,
    wholeNumbersOnly: true,
    position: options.getPosition(options.index, options.parent)
  });

  this.highwaterStats = {
    title: "highwater",
    x: _.reverse(_.times(this.historyDepth, String)),
    y: this.eventLoopHistory,
    style: {
      line: "red"
    }
  };

  this.eventLoopStats = {
    title: "delay",
    x: _.reverse(_.times(this.historyDepth, String)),
    y: this.eventLoopHistory,
    style: {
      line: "yellow"
    }
  };

  options.parent.on("resize", this._onResize.bind(this));

  options.parent.append(this.line);
  this.line.setData([this.eventLoopStats, this.highwaterStats]);
};

EventLoopView.prototype._onResize = function () {
  var options = this.options;

  options.parent.remove(this.line);
  this.line.position = options.getPosition(options.index, options.parent);
  options.parent.append(this.line);
};

EventLoopView.prototype.onEvent = function (data) {
  var eventLoop = data.eventLoop;

  this.highwaterStats.y = _.times(this.historyDepth, _.constant(eventLoop.high));
  this.line.setLabel(util.format(" event loop delay (%dms), high (%dms) ", eventLoop.delay, eventLoop.high)); //eslint-disable-line
  this.eventLoopHistory.push(eventLoop.delay);

  if (this.eventLoopHistory.length > this.historyDepth) {
    this.eventLoopHistory.shift();
  }

  this.line.setData([this.eventLoopStats, this.highwaterStats]);
};

module.exports = EventLoopView;
