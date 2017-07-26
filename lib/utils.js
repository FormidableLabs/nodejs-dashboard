"use strict";

var MAX_PERCENT = 100;

exports.getPercentUsed = function (used, total) {
  var percentUsed = Math.floor(used / total * MAX_PERCENT);
  return isNaN(percentUsed) ? 0 : percentUsed;
};
