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

  this.label = this.layoutConfig.title;
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
  this.values.shift();
  this.values.push(value);

  this.series.y = this._getYAxis();

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

BaseLineGraph.prototype._getXAxis = function () {
  return _.reverse(_.times(this.limit, String));
};

BaseLineGraph.prototype._getYAxis = function () {
  return this.values.slice(-1 * this.limit);
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
