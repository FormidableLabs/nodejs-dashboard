"use strict";

var MAX_PERCENT = 100;

exports.getPercentUsed = function (used, total) {
  return Math.floor(used / total * MAX_PERCENT);
};
