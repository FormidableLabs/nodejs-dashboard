"use strict";

const _ = require("lodash");

// Each layout consists of vertical panels, that contains its position and horizontal views.
// Flex-like positions of panels and views defined by 'grow' and 'size' parameters.
// View or panel with 'size' has exactly <size> height or width respectively.
// View or panel with 'grow' fills <grow> part of the residuary space (it works like flex-grow).
// By default, position = { grow: 1 }

const normalizePosition = function (position) {
  if (!_.has(position, "grow") && !_.has(position, "size")) {
    position = { grow: 1 };
  }

  return position;
};

const concatPosition = function (position1, position2) {
  position1 = normalizePosition(position1);
  position2 = normalizePosition(position2);

  return {
    grow: (position1.grow || 0) + (position2.grow || 0),
    size: (position1.size || 0) + (position2.size || 0)
  };
};

const getSummaryPosition = function (items) {
  return items.map((item) => item.position)
    .reduce(concatPosition, { grow: 0,
      size: 0 });
};

const getSize = function (parentSize, itemPosition) {
  const position = normalizePosition(itemPosition.position);
  if (_.has(position, "size")) {
    return position.size;
  }

  // Prevent last growing view from overflowing screen
  const round = itemPosition.offset.grow + position.grow === itemPosition.summary.grow
    ? Math.floor : Math.ceil;

  return round(
    (parentSize - itemPosition.summary.size) * position.grow / itemPosition.summary.grow
  );
};

const getOffset = function (parentSize, { offset, summary }) {
  return summary.grow ? Math.ceil(
    offset.size + (parentSize - summary.size) * offset.grow / summary.grow
  ) : 0;
};

const createViewLayout = function (view, viewPosition, panelPosition) {
  return {
    view,
    getPosition(parent) {
      return {
        width: getSize(parent.width, panelPosition),
        height: getSize(parent.height, viewPosition),
        left: getOffset(parent.width, panelPosition),
        top: getOffset(parent.height, viewPosition)
      };
    }
  };
};

const createPanelLayout = function (panelPosition, views) {
  const viewSummaryPosition = getSummaryPosition(views);
  let offsetPosition = { size: 0,
    grow: 0 };

  return _.flatMap(views, (view) => {
    const viewPosition = {
      summary: viewSummaryPosition,
      offset: offsetPosition,
      position: view.position
    };

    offsetPosition = concatPosition(view.position, offsetPosition);

    return createViewLayout(view, viewPosition, panelPosition);
  });
};

const createLayout = function (panelsConfig) {
  const panelSummaryPosition = getSummaryPosition(panelsConfig);
  let offsetPosition = { size: 0,
    grow: 0 };

  return panelsConfig.reduce((layouts, panelConfig) => {
    const panelPosition = {
      summary: panelSummaryPosition,
      offset: offsetPosition,
      position: panelConfig.position
    };

    const viewLayouts = createPanelLayout(panelPosition, panelConfig.views);

    offsetPosition = concatPosition(panelConfig.position, offsetPosition);

    return layouts.concat(viewLayouts);
  }, []);
};

// Child views need their position adjusted to fit inside the panel
const wrapGetPosition = function (viewPosition, panelPosition) {
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
const Panel = function Panel(options) {
  const panelLayout = options.layoutConfig;
  const viewLayouts = createLayout(panelLayout.view.views);
  this.getPosition = panelLayout.getPosition;
  this.views = _.map(viewLayouts, (viewLayout) => {
    viewLayout.getPosition = wrapGetPosition(viewLayout.getPosition, panelLayout.getPosition);
    return options.creator(viewLayout);
  });
};

Panel.prototype.destroy = function () {
  _.each(this.views, (view) => {
    if (view && typeof view.destroy === "function") {
      view.destroy();
    }
  });
  this.views = [];
};

module.exports = Panel;
