"use strict";

var blessed = require("blessed");
var util = require("util");
var _ = require("lodash");

var BaseView = require("./base-view");

var MAX_OBJECT_LOG_DEPTH = 20;

var StreamView = function StreamView(options) {
  BaseView.call(this, options);

  this.node = blessed.log({
    label: util.format(" %s ", options.events.join(" / ")),

    position: this.getPosition(),

    scrollable: true,
    alwaysScroll: true,
    scrollback: options.scrollback,
    scrollbar: {
      inverse: true
    },

    input: true,
    keys: true,
    mouse: true,

    tags: true,

    border: "line",
    style: {
      fg: "white",
      bg: "black",
      border: {
        fg: options.color || "#f0f0f0"
      }
    }
  });

  this.parent.append(this.node);
  var eventHandler = this.log.bind(this);
  _.each(options.events, function (eventName) {
    this.parent.screen.on(eventName, eventHandler);
  }.bind(this));
};

StreamView.prototype.log = function (data) {
  this.node.log(data.replace(/\n$/, ""));
};

Object.assign(StreamView.prototype, BaseView.prototype);

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
