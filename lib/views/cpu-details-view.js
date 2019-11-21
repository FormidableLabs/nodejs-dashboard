"use strict";

const os = require("os");
const _ = require("lodash");
const BaseDetailsView = require("./base-details-view");

const CpuDetailsView = function CpuDetailsView(options) {
  BaseDetailsView.call(this, options);
};

CpuDetailsView.prototype = Object.create(BaseDetailsView.prototype);

CpuDetailsView.prototype.getDetails = function () {
  const cpuInfo = os.cpus();

  return _.map(cpuInfo, (info, index) => ({
    label: `[${index}]`,
    data: `${info.model} ${info.speed}`
  }));
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
