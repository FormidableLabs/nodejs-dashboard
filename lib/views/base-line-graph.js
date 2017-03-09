"use strict";

var assert = require("assert");
var contrib = require("blessed-contrib");
var util = require("util");
var _ = require("lodash");

var BaseView = require("./base-view");

var BaseLineGraph = function BaseLineGraph(options) {
  BaseView.call(this, options);

  assert(options.metricsProvider, "View requires metricsProvider");

  this.metricsProvider = options.metricsProvider;

  this.unit = options.unit || "";

  this._remountOnResize = true;

  this.limit = this.layoutConfig.limit;
  this.values = _.times(this.layoutConfig.limit, _.constant(0));

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

  this._createGraph(options);

  this._boundOnEvent = this.onEvent.bind(this);

  options.metricsProvider.on("metrics", this._boundOnEvent);
};

BaseLineGraph.prototype = Object.create(BaseView.prototype);

BaseLineGraph.prototype.onEvent = function () {
  throw new Error("BaseLineGraph onEvent should be overwritten");
};

// Should be called by child's onEvent handler
BaseLineGraph.prototype.update = function (value, highwater) {
  var data;

  this.values.shift();
  this.values.push(value);

  this.series.y = this._getYAxis();

  if (this.highwaterSeries) {
    this.highwaterSeries.y = _.times(this.limit, _.constant(highwater));

    data = [this.series, this.highwaterSeries];
  } else {
    data = [this.series];
  }

  this.node.setLabel(this._getLabel(value, highwater));
  this.node.setData(data);
};

BaseLineGraph.prototype._getLabel = function (value, highwater) {
  var label = this.layoutConfig.title
    .replace(/\{value\}/g, util.format("%d%s", value, this.unit));

  if (this.highwaterSeries) {
    label = label.replace(/\{high\}/g, util.format("%d%s", highwater, this.unit));
  }

  return util.format(" %s ", label);
};

BaseLineGraph.prototype._getXAxis = function () {
  return _.reverse(_.times(this.limit, String));
};

BaseLineGraph.prototype._getYAxis = function () {
  return this.values.slice(-1 * this.limit);
};

BaseLineGraph.prototype._createGraph = function (options) {
  this.node = contrib.line({
    label: this._getLabel(0, 0),
    border: "line",
    numYLabels: 4,
    maxY: options.maxY,
    showLegend: false,
    wholeNumbersOnly: true,
    style: {
      border: {
        fg: this.layoutConfig.borderColor
      }
    }
  });

  this.recalculatePosition();

  this.parent.append(this.node);

  var values = this.metricsProvider.getMetrics(this.limit);
  _.each(values, function (value) {
    this.onEvent(value);
  }.bind(this));
};

BaseLineGraph.prototype.destroy = function () {
  BaseView.prototype.destroy.call(this);

  this.metricsProvider.removeListener("metrics", this._boundOnEvent);

  this._boundOnEvent = null;
  this.metricsProvider = null;
};

module.exports = BaseLineGraph;
