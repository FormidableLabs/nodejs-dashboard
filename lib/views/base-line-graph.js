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
  this.label = this.layoutConfig.title ? util.format(" %s ", this.layoutConfig.title) : " ";

  this._remountOnResize = true;

  this.limit = this.layoutConfig.limit;
  this.seriesOptions = options.series;

  var xAxis = this._getXAxis();
  this.series = _.mapValues(options.series, function (seriesConfig) {
    if (seriesConfig.highwater && !seriesConfig.color) {
      seriesConfig.color = "red";
    }
    return {
      x: xAxis,
      y: _.times(this.layoutConfig.limit, _.constant(0)),
      style: {
        line: seriesConfig.color
      }
    };
  }.bind(this));

  this._createGraph(options);

  this._boundOnEvent = this.onEvent.bind(this);

  options.metricsProvider.on("metrics", this._boundOnEvent);
};

BaseLineGraph.prototype = Object.create(BaseView.prototype);

BaseLineGraph.prototype.onEvent = function () {
  throw new Error("BaseLineGraph onEvent should be overwritten");
};

BaseLineGraph.prototype._isHighwater = function (name) {
  return this.seriesOptions[name].highwater;
};

// Should be called by child's onEvent handler
BaseLineGraph.prototype.update = function (values) {
  _.each(values, function (value, seriesName) {
    if (!this.series[seriesName]) {
      return;
    }
    if (this._isHighwater(seriesName)) {
      this.series[seriesName].y = _.times(this.limit, _.constant(value));
    } else {
      this.series[seriesName].y.shift();
      this.series[seriesName].y.push(value);
    }
  }.bind(this));

  this._updateLabel();

  this.node.setData(_.values(this.series));
};

BaseLineGraph.prototype._updateLabel = function () {
  // use view label + series labels/data

  var seriesLabels = _.map(this.series, function (series, id) {
    var seriesLabel = "";
    if (this.seriesOptions[id].label) {
      seriesLabel = this.seriesOptions[id].label + " ";
    } else if (!this.seriesOptions[id].hasOwnProperty("label")) {
      seriesLabel = id + " ";
    }
    return util.format("%s(%d%s)", seriesLabel, _.last(this.series[id].y), this.unit);
  }.bind(this)).join(", ");

  this.node.setLabel(util.format("%s%s ", this.label, seriesLabels));
};

BaseLineGraph.prototype._getXAxis = function () {
  return _.reverse(_.times(this.limit, String));
};

BaseLineGraph.prototype._createGraph = function (options) {
  this.node = contrib.line({
    label: this.label,
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
