"use strict";

const pkg = require("../package.json");
// Env var names must comply with:
// http://pubs.opengroup.org/onlinepubs/000095399/basedefs/xbd_chap08.html
// See: https://github.com/FormidableLabs/nodejs-dashboard/issues/75
const name = pkg.name.replace("-", "_");

module.exports = {
  PORT: 9838,
  PORT_KEY: `${name}_PORT`,
  REFRESH_INTERVAL: 1000,
  REFRESH_INTERVAL_KEY: `${name}_REFRESH_INTERVAL`,
  BLOCKED_THRESHOLD: 10,
  BLOCKED_THRESHOLD_KEY: `${name}_BLOCKED_THRESHOLD`,
  LAYOUTS: ""
};
