"use strict";

var assert = require("assert");
var _ = require("lodash");

var BaseView = function BaseView(options) {
  assert(options.parent, "View requires parent");
  assert(!options.layoutConfig || _.isFunction(options.layoutConfig.getPosition),
    "View requires layoutConfig option with getPosition function");
  this.parent = options.parent;
  this.layoutConfig = options.layoutConfig;

  this.parent.screen.on("resize", this.recalculatePosition.bind(this));

  this._remountOnResize = false;
};

BaseView.prototype.getPosition = function () {
  return this.layoutConfig.getPosition(this.parent);
};

BaseView.prototype.recalculatePosition = function () {
  if (!this.layoutConfig) {
    this.node.hide();
    return;
  }

  var newPosition = this.getPosition();

  if (!_.isEqual(this.node.position, newPosition)) {
    this.node.position = newPosition;

    if (this._remountOnResize && this.node.parent === this.parent) {
      this.parent.remove(this.node);
      this.parent.append(this.node);
    }
  }
  if (this.node.setBack) {
    this.node.setBack();
  }
  this.node.show();
};

BaseView.prototype.setLayout = function (layoutConfig) {
  assert(!layoutConfig || _.isFunction(layoutConfig.getPosition),
    "View requires layoutConfig option with getPosition function");
  this.layoutConfig = layoutConfig;
  this.recalculatePosition();
};

module.exports = BaseView;
