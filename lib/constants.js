"use strict";

// these define the time levels that data will be aggregated into
// each number is in milliseconds
//
// since these are used as object keys, they are strings
//
// For example, 5000 = 5s and means that one of the aggregate levels
// will be at 5s increments of time
//
// 300000 = 30s and the corresponding zoom will show 30s aggregates
var AGGREGATE_TIME_LEVELS = [
  "1000",
  "5000",
  "10000",
  "15000",
  "30000",
  "60000",
  "300000",
  "600000",
  "900000",
  "1800000",
  "3600000"
];

// this array object is used to reduce ms to its highest human-readable form
// see lib/providers/metrics-provider.js::getTimeIndexLabel
var TIME_SCALES = [
  {
    units: "ms",
    divisor: 1
  }, {
    units: "s",
    divisor: 1000
  }, {
    units: "m",
    divisor: 60
  }, {
    units: "h",
    divisor: 60
  }, {
    units: "d",
    divisor: 24
  }, {
    units: "y",
    divisor: 365.24
  }
];

// what a valid time offset looks like
var TIME_LABEL_PATTERN = /^(\d+y)?\s*(\d{1,3}d)?\s*(\d{1,2})?(:\d{1,2})?(:\d{2})?$/i;

module.exports = {
  AGGREGATE_TIME_LEVELS: AGGREGATE_TIME_LEVELS,
  TIME_LABEL_PATTERN: TIME_LABEL_PATTERN,
  TIME_SCALES: TIME_SCALES
};
