"use strict";

var EventEmitter = require("events").EventEmitter;

var LogProvider = function LogProvider(screen) {
  EventEmitter.call(this);

  this._log = [];

  screen.on("stdout", this._onLog.bind(this, "stdout"));
  screen.on("stderr", this._onLog.bind(this, "stderr"));
};

LogProvider.prototype = Object.create(EventEmitter.prototype);

LogProvider.prototype._onLog = function (source, data) {
  this._log.push([source, data]);

  this.emit(source, data);
};

LogProvider.prototype.getLog = function (sources) {
  return this._log
    .filter(function (entry) { return sources.indexOf(entry[0]) !== -1; })
    .map(function (entry) { return entry[1]; })
    .join("")
    .replace(/\n$/, "");
};

module.exports = LogProvider;
