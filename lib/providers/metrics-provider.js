"use strict";

var EventEmitter = require("events").EventEmitter;

var MetricsProvider = function MetricsProvider(screen) {
  EventEmitter.call(this);

  this._metrics = [];

  screen.on("metrics", this._onMetrics.bind(this));
};

MetricsProvider.prototype = Object.create(EventEmitter.prototype);

MetricsProvider.prototype._onMetrics = function (data) {
  this._metrics.push(data);

  this.emit("metrics", data);
};

MetricsProvider.prototype.getMetrics = function (limit) {
  return this._metrics.slice(-limit);
};

module.exports = MetricsProvider;
