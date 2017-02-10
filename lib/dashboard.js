"use strict";

var _ = require("lodash");
var blessed = require("blessed");

var StreamView = require("./views/stream-view");
var EventLoopView = require("./views/eventloop-view");
var MemoryView = require("./views/memory-view");
var CpuView = require("./views/cpu-view");
var EventEmitter = require("events");

var Dashboard = function Dashboard(options) {
  this.options = options || {};

  this.screen = blessed.screen({
    smartCSR: true,
    title: options.appName
  });

  this.screen.key(["escape", "q", "C-c"], function () {
    process.exit(0); // eslint-disable-line no-process-exit
  });

  this.eventPump = new EventEmitter();
  this._createView();
};

Dashboard.prototype.onEvent = function (event) {
  this.eventPump.emit(event.type, event.data);
  this.screen.render();
};

var stdOutHeight = 0.5;
var stdOutWidth = 0.75;

var metrics = [CpuView, EventLoopView, MemoryView];
var metricsCount = metrics.length;

var stdOutPosition = function (parent, interleave) {
  return {
    left: 0,
    width: Math.ceil(parent.width * stdOutWidth),
    top: 0,
    height: interleave ? parent.height : Math.ceil(parent.height * stdOutHeight)
  };
};

var stdErrPosition = function (parent) {
  return {
    left: 0,
    width: Math.ceil(parent.width * stdOutWidth),
    top: Math.ceil(parent.height * stdOutHeight),
    height: "50%"
  };
};

var metricsPosition = function (index, parent) {
  var top = Math.ceil(index / metricsCount * parent.height);
  var bottom = Math.ceil((index + 1) / metricsCount * parent.height);
  return {
    top: top,
    height: bottom - top,
    left: Math.ceil(parent.width * stdOutWidth),
    width: Math.floor(parent.width * (1 - stdOutWidth))
  };
};

Dashboard.prototype._logStream = function (streamView, data) {
  var lines = data.replace(/\n$/, "");

  streamView.onEvent(lines);
};

Dashboard.prototype._createStdoutView = function (container) {
  var stdoutView = new StreamView({
    parent: container,
    scrollback: this.options.scrollback,
    label: this.options.interleave ? "stdout / stderr" : "stdout",
    color: this.options.interleave ? "light-blue" : "green",
    getPosition: stdOutPosition
  });

  this.eventPump.addListener("stdout", this._logStream.bind(this, stdoutView));
};

Dashboard.prototype._createStderrView = function (container) {
  if (!this.options.interleave) {
    var stderrView = new StreamView({
      parent: container,
      scrollback: this.options.scrollback,
      label: "stderr",
      color: "red",
      getPosition: stdErrPosition
    });

    this.eventPump.addListener("stderr", this._logStream.bind(this, stderrView));
  }
};

Dashboard.prototype._createMetricsViews = function (container) {
  _.each(metrics, function (Metric, index) {
    var view = new Metric({
      parent: container,
      getPosition: metricsPosition,
      index: index
    });
    this.eventPump.addListener("metrics", view.onEvent.bind(view));
  }.bind(this));
};

Dashboard.prototype._createView = function () {
  // fixes weird scrolling issue
  var container = blessed.box({});

  this.screen.append(container);

  this._createStdoutView(container);
  this._createStderrView(container);

  this._createMetricsViews(this.screen);

  this.screen.render();
};

module.exports = Dashboard;
