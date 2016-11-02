"use strict";

var blessed = require("blessed");
var util = require("util");

function StreamView(options) {

  this.scrollBox = blessed.log({
    top: options.top || "0%",
    label: util.format(" %s ", options.label),
    scrollable: true,
    input: true,
    alwaysScroll: true,
    scrollbar: {
      ch: " ",
      inverse: true
    },
    keys: true,
    mouse: true,
    left: "top",
    width: "75%",
    height: "50%",
    tags: true,
    border: {
      type: "line"
    },
    style: {
      fg: "white",
      bg: "black",
      border: {
        fg: options.color || "#f0f0f0"
      }
    }
  });

  options.parent.append(this.scrollBox);
}

StreamView.prototype.onEvent = function (data) {
  this.scrollBox.log(data);
};

module.exports = StreamView;
