"use strict";

const pkg = require("../package.json");

module.exports = {
  PORT_KEY: `${pkg.name}_PORT`,
  BLOCKED_THRESHOLD_KEY: `${pkg.name}_BLOCKED_THRESHOLD`,
  PORT: 9838,
  BLOCKED_THRESHOLD: 10
};
