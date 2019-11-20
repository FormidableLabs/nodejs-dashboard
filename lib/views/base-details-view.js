"use strict";

const blessed = require("blessed");
const _ = require("lodash");
const BaseView = require("./base-view");

const BaseDetailsView = function BaseDetailsView(options) {
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
  const longestLabel = _.reduce(data, (prev, detail) => Math.max(prev, detail.label.length), 0);

  const getFormattedContent = function (prev, details) {
    prev += `{cyan-fg}{bold}${details.label}{/}${
      _.repeat(" ", longestLabel - details.label.length + 1)
    }{green-fg}${details.data}{/}\n`;
    return prev;
  };

  return _.trimEnd(_.reduce(data, getFormattedContent, ""), "\n");
};

module.exports = BaseDetailsView;
