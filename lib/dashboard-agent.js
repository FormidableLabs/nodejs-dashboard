"use strict";

const SocketIO = require("socket.io-client");
const blocked = require("blocked");
const pusage = require("pidusage");
const os = require("os");
const _ = require("lodash");
const config = require("./config");

const dashboardAgent = () => {
  const options = {
    port: process.env[config.PORT_KEY],
    blockedThreshold: process.env[config.BLOCKED_THRESHOLD_KEY],
    refreshInterval: 1000
  };

  const socket = new SocketIO(`http://localhost:${options.port}`);

  const eventLoop = {
    delay: 0,
    high: 0
  };

  blocked((delay) => {
    eventLoop.high = Math.max(eventLoop.high, delay);
    eventLoop.delay = delay;
  }, { threshold: options.blockedThreshold });

  const getStats = (cb) => {
    const metrics = {
      eventLoop,
      mem: {
        systemTotal: os.totalmem()
      },
      cpu: {
        utilization: 0
      }
    };

    _.merge(metrics.mem, process.memoryUsage());

    pusage.stat(process.pid, (err, stat) => {

      if (err) {
        return cb(err);
      }

      metrics.cpu.utilization = stat.cpu;
      return cb(null, metrics);
    });

  };

  const resetEventMetrics = () => {
    eventLoop.delay = 0;
  };

  const startPump = () => {
    setInterval(() => {

      getStats((err, newMetrics) => {
        if (err) {
          console.error("Failed to load metrics: ", err); //eslint-disable-line
          socket.emit("error", JSON.stringify(err));
        } else {
          socket.emit("metrics", JSON.stringify(newMetrics));
        }

        resetEventMetrics();
      });
    }, options.refreshInterval);
  };

  startPump();
};

module.exports = dashboardAgent;
