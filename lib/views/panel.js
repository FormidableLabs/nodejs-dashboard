"use strict";

var _ = require("lodash");

// Each layout consists of vertical panels, that contains its position and horizontal views.
// Flex-like positions of panels and views defined by 'grow' and 'size' parameters.
// View or panel with 'size' has exactly <size> height or width respectively.
// View or panel with 'grow' fills <grow> part of the residuary space (it works like flex-grow).
// By default, position = { grow: 1 }

var normalizePosition = function (position) {
  if (!_.has(position, "grow") && !_.has(position, "size")) {
    position = { grow: 1 };
  }

  return position;
};

var concatPosition = function (position1, position2) {
  position1 = normalizePosition(position1);
  position2 = normalizePosition(position2);

  return {
    grow: (position1.grow || 0) + (position2.grow || 0),
    size: (position1.size || 0) + (position2.size || 0)
  };
};

var getSummaryPosition = function (items) {
  return items.map(function (item) { return item.position; })
    .reduce(concatPosition, { grow: 0, size: 0 });
};

var getSize = function (parentSize, itemPosition) {
  var position = normalizePosition(itemPosition.position);
  if (_.has(position, "size")) {
    return position.size;
  }

  // Prevent last growing view from overflowing screen
  var round = itemPosition.offset.grow + position.grow === itemPosition.summary.grow ?
    Math.floor : Math.ceil;

  return round(
    (parentSize - itemPosition.summary.size) * position.grow / itemPosition.summary.grow
  );
};

var getOffset = function (parentSize, itemPosition) {
  return itemPosition.summary.grow ? Math.ceil(
    itemPosition.offset.size +
    (parentSize - itemPosition.summary.size) * itemPosition.offset.grow / itemPosition.summary.grow
  ) : 0;
};

var createViewLayout = function (view, viewPosition, panelPosition) {
  return {
    view: view,
    getPosition: function (parent) {
      return {
        width: getSize(parent.width, panelPosition),
        height: getSize(parent.height, viewPosition),
        left: getOffset(parent.width, panelPosition),
        top: getOffset(parent.height, viewPosition)
      };
    }
  };
};

var createPanelLayout = function (panelPosition, views) {
  var viewSummaryPosition = getSummaryPosition(views);
  var offsetPosition = { size: 0, grow: 0 };

  return _.flatMap(views, function (view) {
    var viewPosition = {
      summary: viewSummaryPosition,
      offset: offsetPosition,
      position: view.position
    };

    offsetPosition = concatPosition(view.position, offsetPosition);

    return createViewLayout(view, viewPosition, panelPosition);
  });
};

var createLayout = function (panelsConfig) {
  var panelSummaryPosition = getSummaryPosition(panelsConfig);
  var offsetPosition = { size: 0, grow: 0 };

  return panelsConfig.reduce(function (layouts, panelConfig) {
    var panelPosition = {
      summary: panelSummaryPosition,
      offset: offsetPosition,
      position: panelConfig.position
    };

    var viewLayouts = createPanelLayout(panelPosition, panelConfig.views);

    offsetPosition = concatPosition(panelConfig.position, offsetPosition);

    return layouts.concat(viewLayouts);
  }, []);
};

// Child views need their position adjusted to fit inside the panel
var wrapGetPosition = function (viewPosition, panelPosition) {
  return function (parent) {
    return viewPosition(panelPosition(parent));
  };
};

/**
 * A psudeo view that creates sub views and lays them out in columns and rows
 *
 * @param {Object} options view creation options
 *
 * @returns {null} The class needs to be created with new
 */
var Panel = function Panel(options) {
  var panelLayout = options.layoutConfig;
  var viewLayouts = createLayout(panelLayout.view.views);
  this.getPosition = panelLayout.getPosition;
  this.views = _.map(viewLayouts, function (viewLayout) {
    viewLayout.getPosition = wrapGetPosition(viewLayout.getPosition, panelLayout.getPosition);
    return options.creator(viewLayout);
  });
};

Panel.prototype.destroy = function () {
  _.each(this.views, function (view) {
    if (view && typeof view.destroy === "function") {
      view.destroy();
    }
  });
  this.views = [];
};

module.exports = Panel;
