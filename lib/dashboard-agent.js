"use strict";

const SocketIO = require("socket.io-client");
const blocked = require("blocked");
const pusage = require("pidusage");
const os = require("os");
const _ = require("lodash");
const config = require("./config");

const dashboardAgent = function () {
  const options = {
    port: process.env[config.PORT_KEY],
    refreshInterval: process.env[config.REFRESH_INTERVAL_KEY],
    blockedThreshold: process.env[config.BLOCKED_THRESHOLD_KEY]
  };

  // check if the app was launched w/o the dashboard
  // if so, don't start any of the monitoring
  const enabled = options.port && options.refreshInterval && options.blockedThreshold;

  let socket;

  const metrics = {
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

  const _delayed = function (delay) {
    metrics.eventLoop.high = Math.max(metrics.eventLoop.high, delay);
    metrics.eventLoop.delay = delay;
  };

  const _getStats = function (cb) {
    _.merge(metrics.mem, process.memoryUsage());

    pusage(process.pid, (err, stat) => {
      if (err) {
        return cb(err);
      }

      metrics.cpu.utilization = stat.cpu;
      return cb(null, metrics);
    });
  };

  const resetEventMetrics = function () {
    metrics.eventLoop.delay = 0;
  };

  const _emitStats = function () {
    _getStats((err, newMetrics) => {
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

  const startPump = function () {
    if (enabled) {
      socket = new SocketIO(`http://localhost:${options.port}`);
      blocked(_delayed, { threshold: options.blockedThreshold });
      options.intervalId = setInterval(_emitStats, options.refreshInterval);
    }
  };

  const destroy = function () {
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
    _delayed,
    _getStats,
    _emitStats,
    destroy
  };
};

module.exports = dashboardAgent;
