"use strict";

var assert = require("assert");
var _ = require("lodash");

var BaseView = function BaseView(options) {
  assert(options.parent, "View requires parent");
  assert(options.layoutConfig && _.isFunction(options.layoutConfig.getPosition),
    "View requires layoutConfig option with getPosition function");
  this._remountOnResize = false;
  this._getPosition = options.layoutConfig.getPosition;

  this._boundRecalculatePosition = this.recalculatePosition.bind(this);
  options.parent.screen.on("resize", this._boundRecalculatePosition);

  this.parent = options.parent;
  this.layoutConfig = _.assign(this.getDefaultLayoutConfig(options), options.layoutConfig.view);
};

BaseView.prototype.getDefaultLayoutConfig = function () {
  return { };
};

BaseView.prototype.recalculatePosition = function () {
  var newPosition = this._getPosition(this.parent);

  if (!_.isEqual(this.node.position, newPosition)) {
    this.node.position = newPosition;

    if (this._remountOnResize && this.node.parent === this.parent) {
      this.parent.remove(this.node);
      this.parent.append(this.node);
    }
  }
};

BaseView.prototype.destroy = function () {
  if (this.node) {
    this.parent.remove(this.node);
    this.node = null;
  }

  this.parent.screen.removeListener("resize", this._boundRecalculatePosition);
  this._boundRecalculatePosition = null;
};

module.exports = BaseView;
