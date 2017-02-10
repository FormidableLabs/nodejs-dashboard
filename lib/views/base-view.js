"use strict";

var assert = require("assert");

var BaseView = function BaseView(options) {
  assert(options.parent, "View requires parent");
  assert(options.layoutConfig, "View requires layoutConfig option");

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
  this.node.position = this.getPosition();
};

module.exports = BaseView;
