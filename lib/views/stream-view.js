"use strict";

const assert = require("assert");
const blessed = require("blessed");
const util = require("util");
const _ = require("lodash");

const BaseView = require("./base-view");

const MAX_OBJECT_LOG_DEPTH = 20;

// reapply scroll method override from Log
// https://github.com/chjj/blessed/blob/master/lib/widgets/log.js#L69
// which is broken by workaround in Element
// https://github.com/chjj/blessed/blob/master/lib/widgets/element.js#L35
//
// this method prevents auto-scrolling to bottom if user scrolled the view up
// blessed v0.1.81 - https://github.com/chjj/blessed/issues/284
const fixLogScroll = function (log) {
  const maxScrollPercent = 100;

  log.scroll = function (offset, always) {
    if (offset === 0) {
      return this._scroll(offset, always);
    }
    this._userScrolled = true;
    const ret = this._scroll(offset, always);
    if (this.getScrollPerc() === maxScrollPercent) {
      this._userScrolled = false;
    }
    return ret;
  };
};

const StreamView = function StreamView(options) {
  BaseView.call(this, options);

  assert(options.logProvider, "StreamView requires logProvider");

  if (this.layoutConfig.exclude) {
    this.excludeRegex = new RegExp(this.layoutConfig.exclude);
  }

  if (this.layoutConfig.include) {
    this.includeRegex = new RegExp(this.layoutConfig.include);
  }

  this.logProvider = options.logProvider;

  this._createView(options);

  const content = options.logProvider.getLog(this.layoutConfig.streams, options.scrollback);

  if (content.length > 0) {
    this.log(content);
  }

  this._boundLog = this.log.bind(this);
  _.each(this.layoutConfig.streams, (eventName) => {
    this.logProvider.on(eventName, this._boundLog);
  });
};

StreamView.prototype = Object.create(BaseView.prototype);

StreamView.prototype._createView = function () {
  this.node = blessed.log({
    label: util.format(" %s ", this.layoutConfig.title || this.layoutConfig.streams.join(" / ")),

    scrollable: true,
    alwaysScroll: true,
    scrollback: this.layoutConfig.scrollback,
    scrollbar: {
      inverse: true
    },

    input: true,
    keys: true,
    mouse: true,

    tags: true,

    border: "line",
    style: {
      fg: this.layoutConfig.fgColor,
      bg: this.layoutConfig.bgColor,
      border: {
        fg: this.layoutConfig.borderColor
      }
    }
  });

  fixLogScroll(this.node);

  this.recalculatePosition();

  this.parent.append(this.node);
};

StreamView.prototype.getDefaultLayoutConfig = function () {
  return {
    borderColor: "#F0F0F0",
    fgColor: "white",
    bgColor: "black",
    streams: ["stdout", "stderr"],
    scrollback: 1000
  };
};

StreamView.prototype.log = function (data) {
  let lines = data.replace(/\n$/, "");
  if (this.excludeRegex || this.includeRegex) {
    lines = lines.split("\n").reduce((arr, line) => {
      if (this.includeRegex && this.includeRegex.test(line)) {
        const match = line.match(this.includeRegex);
        arr.push(typeof match[1] === "undefined" ? line : match[1]);
      }
      if (this.excludeRegex && !this.excludeRegex.test(line)) {
        arr.push(line);
      }

      return arr;
    }, []);

    if (lines.length === 0) {
      return;
    }

    lines = lines.join("\n");
  }

  this.node.log(lines);
};

StreamView.prototype.destroy = function () {
  BaseView.prototype.destroy.call(this);

  _.each(this.layoutConfig.streams, (eventName) => {
    this.logProvider.removeListener(eventName, this._boundLog);
  });

  this._boundLog = null;
  this.logProvider = null;
};

// fix Log's log/add method, which calls shiftLine with two parameters (start, end)
// when it should call it with just one (num lines to shift out)
// blessed v0.1.81 - https://github.com/chjj/blessed/issues/255
/* nyc ignore next */
blessed.log.prototype.log
= blessed.log.prototype.add = function add() {
    const args = Array.prototype.slice.call(arguments);
    if (typeof args[0] === "object") {
      args[0] = util.inspect(args[0], { showHidden: true,
        depth: MAX_OBJECT_LOG_DEPTH });
    }
    const text = util.format(...args);
    this.emit("log", text);
    const ret = this.pushLine(text);
    if (this.scrollback && this._clines.fake.length > this.scrollback) {
      this.shiftLine(this._clines.fake.length - this.scrollback);
    }
    return ret;
  };

// This fix prevents crashing, when view is removed from parent during before nextTick call
// (see https://github.com/chjj/blessed/blob/master/lib/widgets/log.js#L40)
const _setScrollPerc = blessed.scrollablebox.prototype.setScrollPerc;
blessed.scrollablebox.prototype.setScrollPerc = function (percent) {
  if (this.parent) {
    _setScrollPerc.call(this, percent);
  }
};

module.exports = StreamView;
