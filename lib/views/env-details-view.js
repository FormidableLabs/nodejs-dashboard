"use strict";

var _ = require("lodash");
var BaseDetailsView = require("./base-details-view");

var EnvDetailsView = function EnvDetailsView(options) {
  BaseDetailsView.call(this, options);
};

EnvDetailsView.prototype = Object.create(BaseDetailsView.prototype);

EnvDetailsView.prototype.getDefaultLayoutConfig = function () {
  return {
    label: " Environment Variables ",
    border: "line",
    style: {
      border: {
        fg: "white"
      }
    },
    tags: true,
    scrollable: true,
    keys: true,
    input: true,
    scrollbar: {
      style: {
        fg: "white",
        inverse: true
      },
      track: {
        ch: ":",
        fg: "cyan"
      }
    }
  };
};

EnvDetailsView.prototype.getDetails = function () {
  return _.map(process.env, function (value, key) {
    return {
      label: key,
      data: value
    };
  });
};

module.exports = EnvDetailsView;
