"use strict";

var BaseDetailsView = require("./base-details-view");
var time = require("../time");
var MILLISECONDS_PER_SECOND = require("../constants").MILLISECONDS_PER_SECOND;
var UPTIME_INTERVAL_MS = MILLISECONDS_PER_SECOND;

var NodeDetailsView = function NodeDetailsView(options) {
  BaseDetailsView.call(this, options);

  this.setupdate();
  this.node.on("attach", this.setupdate.bind(this));

  this.node.on("detach", function () {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
      delete this.uptimeInterval;
    }
  }.bind(this));
};

NodeDetailsView.prototype = Object.create(BaseDetailsView.prototype);

NodeDetailsView.prototype.setupdate = function () {
  this.uptimeInterval = this.uptimeInterval || setInterval(function () {
    this.refreshContent();
  }.bind(this), UPTIME_INTERVAL_MS);
};

NodeDetailsView.prototype.getDetails = function () {
  return [
    {
      label: "Version",
      data: process.version
    }, {
      label: "LTS",
      data: process.release.lts
    }, {
      label: "Uptime",
      data: time.getLabel(process.uptime() * MILLISECONDS_PER_SECOND)
    }
  ];
};

NodeDetailsView.prototype.getDefaultLayoutConfig = function () {
  return {
    label: " Node ",
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

module.exports = NodeDetailsView;
