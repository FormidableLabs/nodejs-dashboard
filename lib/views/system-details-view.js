"use strict";

var os = require("os");
var prettyBytes = require("pretty-bytes");
var BaseDetailsView = require("./base-details-view");

var SystemDetailsView = function SystemDetailsView(options) {
  BaseDetailsView.call(this, options);
};

SystemDetailsView.prototype = Object.create(BaseDetailsView.prototype);

SystemDetailsView.prototype.getDetails = function () {
  return [
    {
      label: "Architecture",
      data: os.arch()
    }, {
      label: "Endianness",
      data: os.endianness() === "BE" ? "Big Endian" : "Little Endian"
    }, {
      label: "Host Name",
      data: os.hostname()
    }, {
      label: "Total Memory",
      data: prettyBytes(os.totalmem())
    }, {
      label: "Platform",
      data: os.platform()
    }, {
      label: "Release",
      data: os.release()
    }, {
      label: "Type",
      data: os.type()
    }
  ];
};

SystemDetailsView.prototype.getDefaultLayoutConfig = function () {
  return {
    label: " System ",
    border: "line",
    tags: true,
    height: "shrink",
    style: {
      border: {
        fg: "white"
      }
    }
  };
};

module.exports = SystemDetailsView;
