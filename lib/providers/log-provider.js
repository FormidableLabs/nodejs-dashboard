"use strict";

var EventEmitter = require("events").EventEmitter;

var LogProvider = function LogProvider(screen) {
  EventEmitter.call(this);

  this._log = [];
  this.limit = 10000;

  screen.on("stdout", this._onLog.bind(this, "stdout"));
  screen.on("stderr", this._onLog.bind(this, "stderr"));
};

LogProvider.prototype = Object.create(EventEmitter.prototype);

LogProvider.setLimit = function (limit) {
  this.limit = Math.max(this.limit, limit);
};

LogProvider.prototype._onLog = function (source, data) {
  this._log.push([source, data]);
  if (this._log.length > this.limit) {
    this._log = this._log.slice(this.limit - this._log.length);
  }

  this.emit(source, data);
};

LogProvider.prototype.getLog = function (sources, limit) {
  return this._log
    .filter(function (entry) { return sources.indexOf(entry[0]) !== -1; })
    .slice(0, limit || this.limit)
    .map(function (entry) { return entry[1]; })
    .join("")
    .replace(/\n$/, "");
};

module.exports = LogProvider;
