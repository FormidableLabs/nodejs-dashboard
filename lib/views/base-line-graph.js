"use strict";

const assert = require("assert");
const contrib = require("blessed-contrib");
const util = require("util");
const _ = require("lodash");

const BaseView = require("./base-view");

const BaseLineGraph = function BaseLineGraph(options) {
  const setupEventHandlers = function setupEventHandlers() {
    this._boundOnEvent = this.onEvent.bind(this);
    this._boundOnRefreshMetrics = this.onRefreshMetrics.bind(this);

    options.metricsProvider.on("metrics", this._boundOnEvent);
    options.metricsProvider.on("refreshMetrics", this._boundOnRefreshMetrics);
  }.bind(this);

  BaseView.call(this, options);

  assert(options.metricsProvider, "View requires metricsProvider");
  this.metricsProvider = options.metricsProvider;

  this.unit = options.unit || "";
  this.label = this.layoutConfig.title ? util.format(" %s ", this.layoutConfig.title) : " ";

  this._remountOnResize = true;

  this.limit = this.layoutConfig.limit;
  this.seriesOptions = options.series;

  const xAxis = this.metricsProvider.getXAxis(this.layoutConfig.limit);
  this.series = _.mapValues(options.series, (seriesConfig) => {
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
  });

  this._createGraph(options);

  setupEventHandlers();
};

BaseLineGraph.prototype = Object.create(BaseView.prototype);

BaseLineGraph.prototype.onEvent = function () {
  throw new Error("BaseLineGraph onEvent should be overridden");
};

BaseLineGraph.prototype.onRefreshMetrics = function () {
  throw new Error("BaseLineGraph onRefreshMetrics should be overridden");
};

BaseLineGraph.prototype._isHighwater = function (name) {
  return this.seriesOptions[name].highwater;
};

// Should be called by child's onEvent handler
BaseLineGraph.prototype.update = function (values) {
  _.each(values, (value, seriesName) => {
    if (!this.series[seriesName]) {
      return;
    }
    if (this._isHighwater(seriesName)) {
      this.series[seriesName].y = _.times(this.limit, _.constant(value));
    } else {
      this.series[seriesName].y.shift();
      this.series[seriesName].y.push(value);
    }
  });

  this._updateLabel();

  this.node.setData(_.values(this.series));
};

BaseLineGraph.prototype.refresh = function (mapper) {
  const data = mapper(this.metricsProvider.getMetrics(this.limit));
  const xAxis = this.metricsProvider.getXAxis(this.layoutConfig.limit);

  _.each(data[0], (value, seriesName) => {
    if (!this.series[seriesName]) {
      return;
    }
    if (this._isHighwater(seriesName)) {
      this.series[seriesName].y = _.times(this.limit, _.constant(value));
    } else {
      this.series[seriesName].y = _.times(this.limit, _.constant(0));
    }
    this.series[seriesName].x = xAxis;
  });

  _.each(data, (values) => {
    _.each(values, (value, seriesName) => {
      if (!this.series[seriesName]) {
        return;
      }
      if (!this._isHighwater(seriesName)) {
        this.series[seriesName].y.shift();
        this.series[seriesName].y.push(value);
      }
    });
  });

  this._updateLabel();

  this.node.setData(_.values(this.series));
};

BaseLineGraph.prototype._updateLabel = function () {
  // use view label + series labels/data

  const seriesLabels = _.map(this.series, (series, id) => {
    let seriesLabel = "";
    if (this.seriesOptions[id].label) {
      seriesLabel = `${this.seriesOptions[id].label} `;
    } else if (!this.seriesOptions[id].hasOwnProperty("label")) {
      seriesLabel = `${id} `;
    }
    return util.format("%s(%d%s)", seriesLabel, _.last(this.series[id].y), this.unit);
  }).join(", ");

  this.node.setLabel(util.format("%s%s ", this.label, seriesLabels));
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

  const values = this.metricsProvider.getMetrics(this.limit);
  _.each(values, (value) => {
    this.onEvent(value);
  });
};

BaseLineGraph.prototype.destroy = function () {
  BaseView.prototype.destroy.call(this);

  this.metricsProvider.removeListener("metrics", this._boundOnEvent);
  this.metricsProvider.removeListener("refreshMetrics", this._boundOnRefreshMetrics);

  this._boundOnEvent = null;
  this._boundOnRefreshMetrics = null;
  this.metricsProvider = null;
};

module.exports = BaseLineGraph;
