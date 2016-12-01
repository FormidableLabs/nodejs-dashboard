"use strict";

var blessed = require("blessed");
var util = require("util");

var MAX_OBJECT_LOG_DEPTH = 20;

var StreamView = function StreamView(options) {

  this.scrollBox = blessed.log({
    top: options.top || "0%",
    label: util.format(" %s ", options.label),
    scrollable: true,
    input: true,
    alwaysScroll: true,
    scrollback: options.scrollback,
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
};

StreamView.prototype.onEvent = function (data) {
  this.scrollBox.log(data);
};

// this is to fix the Log's log/add method
// the original method calls shiftLine with two parameters (start, end)
// when it should call it with just one (num lines to shift out)
// blessed v0.1.81 - https://github.com/chjj/blessed/issues/255
blessed.log.prototype.log =
blessed.log.prototype.add = function add() {
  var args = Array.prototype.slice.call(arguments);
  if (typeof args[0] === "object") {
    args[0] = util.inspect(args[0], { showHidden: true, depth: MAX_OBJECT_LOG_DEPTH });
  }
  var text = util.format.apply(util, args);
  this.emit("log", text);
  var ret = this.pushLine(text);
  if (this.scrollback && this._clines.fake.length > this.scrollback) {
    this.shiftLine(this._clines.fake.length - this.scrollback);
  }
  return ret;
};

module.exports = StreamView;
