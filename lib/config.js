"use strict";

var pkg = require("../package.json");

/* eslint-disable no-magic-numbers */

// these define the time buckets that data will be aggregated against
// each number is in milliseconds

// For example, 5000 = 5s and means that one of the aggregate levels
// will be at 5s increments of time

// 300000 = 30s and the corresponding zoom will show 30s aggregates
var AGGREGATE_TIME_BUCKETS = [
  5000,
  10000,
  15000,
  30000,
  60000,
  300000,
  600000,
  900000,
  1800000,
  3600000
];
/* eslint-enable no-magic-numbers */

module.exports = {
  PORT: 9838,
  PORT_KEY: pkg.name + "_PORT",
  REFRESH_INTERVAL: 1000,
  REFRESH_INTERVAL_KEY: pkg.name + "_REFRESH_INTERVAL",
  BLOCKED_THRESHOLD: 10,
  BLOCKED_THRESHOLD_KEY: pkg.name + "_BLOCKED_THRESHOLD",
  LAYOUTS: "",
  AGGREGATE_TIME_BUCKETS: AGGREGATE_TIME_BUCKETS
};
