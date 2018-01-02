"use strict";

var _ = require("lodash");
var StreamView = require("./stream-view");
var EventLoopView = require("./eventloop-view");
var MemoryGaugeView = require("./memory-gauge-view");
var MemoryGraphView = require("./memory-graph-view");
var CpuView = require("./cpu-view");
var BaseView = require("./base-view");
var CpuDetailsView = require("./cpu-details-view");
var EnvDetailsView = require("./env-details-view");
var NodeDetailsView = require("./node-details-view");
var SystemDetailsView = require("./system-details-view");
var UserDetailsView = require("./user-details-view");
var Panel = require("./panel");

var VIEW_MAP = {
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
var applyCustomizations = function (customizations, layoutConfig) {
  var customization = customizations[layoutConfig.view.type];
  if (!customization) {
    return layoutConfig;
  }
  return _.merge(layoutConfig, { view: customization });
};

var getConstructor = function (options) {
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
  var customized = applyCustomizations(customizations, layoutConfig);
  var viewOptions = Object.assign({}, options, {
    layoutConfig: customized,
    creator: function (layout) {
      return create(layout, options, customizations);
    }
  });
  var View = getConstructor(customized.view);
  return View ? new View(viewOptions) : null;
};
