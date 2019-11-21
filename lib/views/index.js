"use strict";

const _ = require("lodash");
const StreamView = require("./stream-view");
const EventLoopView = require("./eventloop-view");
const MemoryGaugeView = require("./memory-gauge-view");
const MemoryGraphView = require("./memory-graph-view");
const CpuView = require("./cpu-view");
const BaseView = require("./base-view");
const CpuDetailsView = require("./cpu-details-view");
const EnvDetailsView = require("./env-details-view");
const NodeDetailsView = require("./node-details-view");
const SystemDetailsView = require("./system-details-view");
const UserDetailsView = require("./user-details-view");
const Panel = require("./panel");

const VIEW_MAP = {
  cpuDetails: CpuDetailsView,
  envDetails: EnvDetailsView,
  nodeDetails: NodeDetailsView,
  systemDetails: SystemDetailsView,
  userDetails: UserDetailsView,
  log: StreamView,
  cpu: CpuView,
  memory: MemoryGaugeView,
  memoryGraph: MemoryGraphView,
  eventLoop: EventLoopView,
  panel: Panel
};

// Customize view types based on a settings class
const applyCustomizations = function (customizations, layoutConfig) {
  const customization = customizations[layoutConfig.view.type];
  if (!customization) {
    return layoutConfig;
  }
  return _.merge(layoutConfig, { view: customization });
};

const getConstructor = function (options) {
  options = options || {};
  if (VIEW_MAP[options.type]) {
    return VIEW_MAP[options.type];
  } else if (options.module) {
    // eslint-disable-next-line global-require
    return require(options.module)(BaseView);
  }
  return null;
};

/**
 * Creates a view
 *
 * @param {Object} layoutConfig raw layout { type, views, position }
 * @param {Object} options startup options for views
 * @param {Object} customizations view type customiztaions
 *
 * @returns {Object} created view oject
 */
module.exports.create = function create(layoutConfig, options, customizations) {
  const customized = applyCustomizations(customizations, layoutConfig);
  const viewOptions = Object.assign({}, options, {
    layoutConfig: customized,
    creator(layout) {
      return create(layout, options, customizations);
    }
  });
  const View = getConstructor(customized.view);
  return View ? new View(viewOptions) : null;
};
