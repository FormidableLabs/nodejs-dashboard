"use strict";

var pkg = require("../package.json");

module.exports = {
  PORT: 9838,
  PORT_KEY: pkg.name + "_PORT",
  REFRESH_INTERVAL: 1000,
  REFRESH_INTERVAL_KEY: pkg.name + "_REFRESH_INTERVAL",
  BLOCKED_THRESHOLD: 10,
  BLOCKED_THRESHOLD_KEY: pkg.name + "_BLOCKED_THRESHOLD",
  SCROLLBACK: 1000
};
