"use strict";

var _ = require("lodash");
var blessed = require("blessed");

var StreamView = require("./views/stream-view");
var EventLoopView = require("./views/eventloop-view");
var MemoryGaugeView = require("./views/memory-gauge-view");
var MemoryGraphView = require("./views/memory-graph-view");
var CpuView = require("./views/cpu-view");
var HelpView = require("./views/help");
var generateLayouts = require("./generate-layouts");
var LogProvider = require("./providers/log-provider");
var MetricsProvider = require("./providers/metrics-provider");
var BaseView = require("./views/base-view");

var THROTTLE_TIMEOUT = 150;

var Dashboard = function Dashboard(options) {
  this.options = options || {};
  this.views = {};
  this.settings = options.settings;

  this.screen = blessed.screen({
    smartCSR: true,
    title: options.appName
  });

  this.logProvider = new LogProvider(this.screen);
  this.metricsProvider = new MetricsProvider(this.screen);

  this._createViews();
  this._configureKeys();
  this.screen.render();
};

Dashboard.prototype._createViews = function () {
  this.layouts = generateLayouts(this.options.layoutsFile);
  this.views = [];

  // container prevents stream view scrolling from interfering with side views
  this.container = blessed.box();
  this.screen.append(this.container);

  this.helpView = new HelpView({
    parent: this.container
  });

  this._showLayout(0);
};

Dashboard.prototype._configureKeys = function () {

  this.screen.key(["left", "right"], _.throttle(function (ch, key) {
    var delta = key.name === "left" ? -1 : 1;
    var target = (this.currentLayout + delta + this.layouts.length) % this.layouts.length;
    this._showLayout(target);
  }.bind(this), THROTTLE_TIMEOUT));

  var helpNode = this.helpView.node;
  this.screen.key(["?", "h"], function () {
    helpNode.toggle();
    this.screen.render();
  }.bind(this));

  this.screen.key("escape", function () {
    if (helpNode.visible) {
      helpNode.hide();
      this.screen.render();
    } else {
      this._showLayout(0);
    }
  }.bind(this));

  this.screen.key(["q", "C-c"], function () {
    process.exit(0); // eslint-disable-line no-process-exit
  });

  this.screen.key(["up", "down"], _.throttle(function (ch, key) {
    var zoom = key.name === "down" ? -1 : 1;
    this.screen.emit("zoomAggregate", zoom);
    this._showLayout(this.currentLayout, true);
  }.bind(this), THROTTLE_TIMEOUT));
};

Dashboard.prototype.onEvent = function (event) {
  this.screen.emit(event.type, event.data);
  // avoid double screen render for stream events (Element calls screen.render on scroll)
  // TODO dashboard shouldn't know which events are used by which widgets
  if (event.type === "metrics") {
    this.screen.render();
  }
};

var VIEW_MAP = {
  log: StreamView,
  cpu: CpuView,
  memory: MemoryGaugeView,
  memoryGraph: MemoryGraphView,
  eventLoop: EventLoopView
};

Dashboard.prototype._showLayout = function (id, forced) {
  if (this.currentLayout === id && !forced) {
    return;
  }
  _.each(this.views, function (view) {
    view.destroy();
  });

  this.views = [];

  _.each(this.layouts[id], function (layoutConfig) {
    var View;

    if (VIEW_MAP[layoutConfig.view.type]) {
      View = VIEW_MAP[layoutConfig.view.type];
    } else if (layoutConfig.view.module) {
      // eslint-disable-next-line global-require
      View = require(layoutConfig.view.module)(BaseView);
    }

    if (View) {
      if (this.settings[layoutConfig.view.type]) {
        layoutConfig = _.merge(layoutConfig, {
          view: this.settings[layoutConfig.view.type]
        });
      }
      var view = new View({
        parent: this.container,
        logProvider: this.logProvider,
        metricsProvider: this.metricsProvider,
        layoutConfig: layoutConfig
      });

      this.views.push(view);
    }
  }.bind(this));

  this.currentLayout = id;
  this.helpView.node.setFront();
  this.screen.render();
};

module.exports = Dashboard;
