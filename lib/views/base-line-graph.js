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
  this.highwater = options.highwater;

  this.maxLimit = this.layoutConfig.limit;
  this.values = _.times(this.layoutConfig.limit, _.constant(0));

  this._createGraph(options);
  this.parent.screen.on("metrics", this.onEvent.bind(this));
};

Object.assign(BaseLineGraph.prototype, BaseView.prototype);

BaseLineGraph.prototype.onEvent = function () {
  throw new Error("BaseLineGraph onEvent should be overwritten");
};

BaseLineGraph.prototype.recalculatePosition = function () {
  this.node.position = this.getPosition();
  // force line graph to re-render with new position
  this.parent.remove(this.node);
  this.parent.append(this.node);
};

BaseLineGraph.prototype.setLayout = function (layoutConfig) {
  this.layoutConfig = layoutConfig;
  this._handleLimitChanged();
  this.recalculatePosition();
};

// Should be called by child's onEvent handler
BaseLineGraph.prototype.update = function (value, highwater) {
  if (this.values.length >= this.maxLimit) {
    this.values.shift();
  }
  this.values.push(value);

  this.series.y = this.values.slice(-1 * this.layoutConfig.limit);

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
  return _.reverse(_.times(this.layoutConfig.limit, String));
};

BaseLineGraph.prototype._createGraph = function (options) {
  this.node = contrib.line({
    label: util.format(" %s ", this.label),
    border: "line",
    position: this.getPosition(this.parent),
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
  this.parent.screen.log("set position for graph:", this.getPosition(this.parent));

  this.series = {
    x: this._getXAxis(),
    y: this.values.slice(-1 * this.layoutConfig.limit)
  };

  if (this.highwater) {
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
  if (this.series.x.length === this.layoutConfig.limit) {
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
