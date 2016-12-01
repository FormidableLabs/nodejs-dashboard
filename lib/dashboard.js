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

Dashboard.prototype._createView = function () {
  // fixes weird scrolling issue
  var container = blessed.box({});
  this.screen.append(container);

  var stdoutView = new StreamView({
    parent: container,
    scrollback: this.options.scrollback,
    label: "stdout",
    color: "green"
  });

  this.eventPump.addListener("stdout", stdoutView.onEvent.bind(stdoutView));

  var stderrView = new StreamView({
    parent: container,
    scrollback: this.options.scrollback,
    label: "stderr",
    color: "red",
    top: "50%"
  });

  this.eventPump.addListener("stderr", stderrView.onEvent.bind(stderrView));

  var metrics = [MemoryView, CpuView, EventLoopView];

  _.each(metrics, function (Metric) {
    var view = new Metric({ parent: this.screen });
    this.eventPump.addListener("metrics", view.onEvent.bind(view));
  }.bind(this));

  this.screen.render();
};

module.exports = Dashboard;
