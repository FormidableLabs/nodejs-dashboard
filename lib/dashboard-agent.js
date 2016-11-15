"use strict";

var SocketIO = require("socket.io-client");
var blocked = require("blocked");
var pusage = require("pidusage");
var os = require("os");
var _ = require("lodash");
var config = require("./config");

var dashboardAgent = function () {

  var options = {
    port: process.env[config.PORT_KEY],
    refreshInterval: process.env[config.REFRESH_INTERVAL_KEY],
    blockedThreshold: process.env[config.BLOCKED_THRESHOLD_KEY]
  };

  // check if the app was launched w/o the dashboard
  // if so, don't start any of the monitoring
  var enabled = options.port && options.refreshInterval && options.blockedThreshold;

  var socket;

  var metrics = {
    eventLoop: {
      delay: 0,
      high: 0
    },
    mem: {
      systemTotal: os.totalmem()
    },
    cpu: {
      utilization: 0
    }
  };

  var _delayed = function (delay) {
    metrics.eventLoop.high = Math.max(metrics.eventLoop.high, delay);
    metrics.eventLoop.delay = delay;
  };

  var _getStats = function (cb) {
    _.merge(metrics.mem, process.memoryUsage());

    pusage.stat(process.pid, function (err, stat) {

      if (err) {
        return cb(err);
      }

      metrics.cpu.utilization = stat.cpu;
      return cb(null, metrics);
    });

  };

  var resetEventMetrics = function () {
    metrics.eventLoop.delay = 0;
  };

  var _emitStats = function () {

    _getStats(function (err, newMetrics) {
      if (err) {
        console.error("Failed to load metrics: ", err); //eslint-disable-line
        if (socket && socket.connected) {
          socket.emit("error", JSON.stringify(err));
        }
      } else if (socket && socket.connected) {
        socket.emit("metrics", JSON.stringify(newMetrics));
      }

      resetEventMetrics();
    });

  };

  var startPump = function () {
    if (enabled) {
      socket = new SocketIO("http://localhost:" + options.port);
      blocked(_delayed, { threshold: options.blockedThreshold });
      options.intervalId = setInterval(_emitStats, options.refreshInterval);
    }
  };

  var destroy = function () {
    if (socket) {
      socket.close();
      socket = null;
    }
    if (options.intervalId) {
      clearInterval(options.intervalId);
      options.intervalId = null;
    }
  };

  startPump();

  return {
    _delayed: _delayed,
    _getStats: _getStats,
    _emitStats: _emitStats,
    destroy: destroy
  };
};

module.exports = dashboardAgent;
