"use strict";

var pkg = require("../package.json");

module.exports = {
  PORT: 9838,
  PORT_KEY: pkg.name + "_PORT",
  BLOCKED_THRESHOLD: 10,
  BLOCKED_THRESHOLD_KEY: pkg.name + "_BLOCKED_THRESHOLD",
  SCROLLBACK: 1000
};
