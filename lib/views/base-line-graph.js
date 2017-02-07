"use strict";

var assert = require("assert");
var contrib = require("blessed-contrib");
var util = require("util");
var _ = require("lodash");

var BaseLineGraph = function BaseLineGraph(options) {
  _.each(["parent", "position", "limit", "label"], function (field) {
    assert(options[field], util.format("BaseLineGraph requires %s option", field));
    this[field] = options[field];
  }.bind(this));
  this.unit = options.unit || "";
  this.maxY = options.maxY;
  this.highwater = options.highwater;

  this.maxLimit = this.limit;
  this.values = _.times(this.limit, _.constant(0));

  this._createGraph();
  this.parent.screen.on("metrics", this.onEvent.bind(this));
};

BaseLineGraph.prototype.onEvent = function () {
  throw new Error("BaseLineGraph onEvent should be overwritten");
};

BaseLineGraph.prototype.resize = function (position, limit) {
  this._setLimit(limit);
  this._setPosition(position);
};

// Should be called by child's onEvent handler
BaseLineGraph.prototype.update = function (value, highwater) {
  if (this.values.length >= this.maxLimit) {
    this.values.shift();
  }
  this.values.push(value);

  this.series.y = this.values.slice(-1 * this.limit);

  if (this.highwaterSeries) {
    this.highwaterSeries.y = _.times(this.limit, _.constant(highwater));
    this.node.setLabel(util.format(" %s (%d%s), high (%d%s) ",
      this.label, value, this.unit, highwater, this.unit));
    this.node.setData([this.series, this.highwaterSeries]);
  } else {
    this.node.setLabel(util.format(" %s (%s%s) ", this.label, value, this.unit));
    this.node.setData([this.series]);
  }
};

BaseLineGraph.prototype._createGraph = function () {
  this.node = contrib.line({
    label: util.format(" %s ", this.label),
    border: "line",
    position: this.position,
    numYLabels: 4,
    maxY: this.maxY,
    showLegend: false,
    wholeNumbersOnly: true,
    style: {
      border: {
        fg: "cyan"
      }
    }
  });

  var xAxis = _.reverse(_.times(this.limit, String));

  this.series = {
    x: xAxis,
    y: this.values.slice(-1 * this.limit)
  };

  if (this.highwater) {
    this.highwaterSeries = {
      x: xAxis,
      style: {
        line: "red"
      }
    };
  }

  this.parent.append(this.node);
  this.node.setData([this.series]);
};

BaseLineGraph.prototype._setLimit = function (limit) {
  if (!limit || limit === this.limit) {
    return;
  }
  if (limit > this.values.length) {
    this.values = _.times(limit - this.values.length, _.constant(0)).concat(this.values);
  }
  this.limit = limit;
  this.maxLimit = Math.max(limit, this.maxLimit);
};

BaseLineGraph.prototype._setPosition = function (position) {
  if (!position || _.isEqual(position, this.position)) {
    return;
  }
  this.position = position;
  // there's no way to resize line chart itself except to recreate it
  // https://github.com/yaronn/blessed-contrib/issues/10
  this.parent.remove(this.node);
  this._createGraph();
};

module.exports = BaseLineGraph;
