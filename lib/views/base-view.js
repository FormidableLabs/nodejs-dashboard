"use strict";

var assert = require("assert");
var _ = require("lodash");

var BaseView = function BaseView(options) {
  assert(options.parent, "View requires parent");
  assert(options.layoutConfig && _.isFunction(options.layoutConfig.getPosition),
    "View requires layoutConfig option with getPosition function");

  this.parent = options.parent;
  this.layoutConfig = options.layoutConfig;

  this.parent.screen.on("resize", this.recalculatePosition.bind(this));
};

BaseView.prototype.getPosition = function () {
  return this.layoutConfig.getPosition(this.parent);
};

BaseView.prototype.recalculatePosition = function () {
  this.node.position = this.getPosition();
};

BaseView.prototype.setLayout = function (layoutConfig) {
  this.layoutConfig = layoutConfig;
  this.recalculatePosition();
};

module.exports = BaseView;
