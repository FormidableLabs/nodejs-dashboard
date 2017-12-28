"use strict";

var os = require("os");
var _ = require("lodash");
var BaseDetailsView = require("./base-details-view");

var CpuDetailsView = function CpuDetailsView(options) {
  BaseDetailsView.call(this, options);
};

CpuDetailsView.prototype = Object.create(BaseDetailsView.prototype);

CpuDetailsView.prototype.getDetails = function () {
  var cpuInfo = os.cpus();

  return _.map(cpuInfo, function (info, index) {
    return {
      label: "[" + index + "]",
      data: info.model + " " + info.speed
    };
  });
};

CpuDetailsView.prototype.getDefaultLayoutConfig = function () {
  return {
    label: " CPU(s) ",
    border: "line",
    tags: true,
    style: {
      border: {
        fg: "white"
      }
    }
  };
};

module.exports = CpuDetailsView;
