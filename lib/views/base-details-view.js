"use strict";

var blessed = require("blessed");
var _ = require("lodash");
var BaseView = require("./base-view");

var BaseDetailsView = function BaseDetailsView(options) {
  BaseView.call(this, options);

  this.screen = options.parent.screen;
  this.node = blessed.box(this.layoutConfig);
  this.parent.append(this.node);

  this.refreshContent();
  this.recalculatePosition();
};

BaseDetailsView.prototype = Object.create(BaseView.prototype);

BaseDetailsView.prototype.refreshContent = function () {
  this.node.setContent(this._getBoxContent(this.getDetails()));
  this.screen.render();
};

BaseDetailsView.prototype.getDetails = function () {
  return [];
};

/**
 * Given data and optional filters, return the content for a box.
 *
 * @param {Object[]} data
 * This is the array of label/data objects that define each data
 * point for the box.
 *
 * @returns {String}
 * The content string for the box is returned.
 */
BaseDetailsView.prototype._getBoxContent = function (data) {
  var longestLabel = _.reduce(data, function (prev, detail) {
    return Math.max(prev, detail.label.length);
  }, 0);

  var getFormattedContent = function (prev, details) {
    prev += "{cyan-fg}{bold}" + details.label + "{/}"
      + _.repeat(" ", longestLabel - details.label.length + 1)
      + "{green-fg}" + details.data + "{/}\n";
    return prev;
  };

  return _.trimEnd(_.reduce(data, getFormattedContent, ""), "\n");
};

module.exports = BaseDetailsView;
