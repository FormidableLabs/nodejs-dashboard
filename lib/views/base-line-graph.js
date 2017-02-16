"use strict";

var assert = require("assert");
var contrib = require("blessed-contrib");
var util = require("util");
var _ = require("lodash");

var BaseView = require("./base-view");

var BaseLineGraph = function BaseLineGraph(options) {
  BaseView.call(this, options);

  assert(options.label, "BaseLineGraph requires 'label' option");
  this.label = options.label;

  this.unit = options.unit || "";

  this.values = [];
  if (this.layoutConfig) {
    this.maxLimit = this.layoutConfig.limit;
    this.values = _.times(this.layoutConfig.limit, _.constant(0));
  }

  this._remountOnResize = true;

  this._createGraph(options);

  this.parent.screen.on("metrics", this.onEvent.bind(this));
};

BaseLineGraph.prototype = Object.create(BaseView.prototype);

BaseLineGraph.prototype.onEvent = function () {
  throw new Error("BaseLineGraph onEvent should be overwritten");
};

BaseLineGraph.prototype.setLayout = function (layoutConfig) {
  this.layoutConfig = layoutConfig;
  this._handleLimitChanged();
  this.recalculatePosition();
};

// Should be called by child's onEvent handler
BaseLineGraph.prototype.update = function (value, highwater) {
  if (!this.layoutConfig) {
    return;
  }

  this.values.shift();
  this.values.push(value);

  this.series.y = this._getYAxis();

  if (this.highwaterSeries) {
    this.highwaterSeries.y = _.times(this.layoutConfig.limit, _.constant(highwater));
    this.node.setLabel(util.format(" %s (%d%s), high (%d%s) ",
      this.label, value, this.unit, highwater, this.unit));
    this.node.setData([this.series, this.highwaterSeries]);
  } else {
    this.node.setLabel(util.format(" %s (%s%s) ", this.label, value, this.unit));
    this.node.setData([this.series]);
  }
};

BaseLineGraph.prototype._getXAxis = function () {
  if (!this.layoutConfig) {
    return [];
  }
  return _.reverse(_.times(this.layoutConfig.limit, String));
};

BaseLineGraph.prototype._getYAxis = function () {
  if (!this.layoutConfig) {
    return [];
  }
  return this.values.slice(-1 * this.layoutConfig.limit);
};

BaseLineGraph.prototype._createGraph = function (options) {
  this.node = contrib.line({
    label: util.format(" %s ", this.label),
    border: "line",
    numYLabels: 4,
    maxY: options.maxY,
    showLegend: false,
    wholeNumbersOnly: true,
    style: {
      border: {
        fg: "cyan"
      }
    }
  });

  this.recalculatePosition();

  this.series = {
    x: this._getXAxis(),
    y: this._getYAxis()
  };

  if (options.highwater) {
    this.highwaterSeries = {
      x: this.series.x,
      style: {
        line: "red"
      }
    };
  }

  this.parent.append(this.node);
  this.node.setData([this.series]);
};

BaseLineGraph.prototype._handleLimitChanged = function () {
  if (!this.layoutConfig || this.series.x.length === this.layoutConfig.limit) {
    return;
  }
  this.maxLimit = Math.max(this.layoutConfig.limit, this.maxLimit);

  this.series.x = this._getXAxis();
  if (this.highwaterSeries) {
    this.highwaterSeries.x = this.series.x;
  }

  if (this.layoutConfig.limit > this.values.length) {
    var filler = _.times(this.layoutConfig.limit - this.values.length, _.constant(0));
    this.values = filler.concat(this.values);
  }
};

module.exports = BaseLineGraph;
