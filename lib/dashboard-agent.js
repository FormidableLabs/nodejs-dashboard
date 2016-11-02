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
    blockedThreshold: process.env[config.BLOCKED_THRESHOLD_KEY],
    refreshInterval: 1000
  };

  var socket = new SocketIO("http://localhost:" + options.port);

  var eventLoop = {
    delay: 0,
    high: 0
  };

  var _delayed = function (delay) {
    eventLoop.high = Math.max(eventLoop.high, delay);
    eventLoop.delay = delay;
  };

  blocked(_delayed, { threshold: options.blockedThreshold });

  var _getStats = function (cb) {
    var metrics = {
      eventLoop: eventLoop,
      mem: {
        systemTotal: os.totalmem()
      },
      cpu: {
        utilization: 0
      }
    };

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
    eventLoop.delay = 0;
  };

  var _emitStats = function () {
    _getStats(function (err, newMetrics) {
      if (err) {
        console.error("Failed to load metrics: ", err); //eslint-disable-line
        socket.emit("error", JSON.stringify(err));
      } else {
        socket.emit("metrics", JSON.stringify(newMetrics));
      }

      resetEventMetrics();
    });
  };

  var startPump = function () {
    options.intervalId = setInterval(_emitStats, options.refreshInterval);
  };

  var destroy = function () {
    socket.close();
    clearInterval(options.intervalId);
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
