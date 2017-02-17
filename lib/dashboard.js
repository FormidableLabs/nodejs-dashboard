"use strict";

var _ = require("lodash");
var blessed = require("blessed");

var StreamView = require("./views/stream-view");
var EventLoopView = require("./views/eventloop-view");
var MemoryView = require("./views/memory-view");
var CpuView = require("./views/cpu-view");
var HelpView = require("./views/help");
var generateLayouts = require("./generate-layouts");
var LogProvider = require("./providers/log-provider");
var MetricsProvider = require("./providers/metrics-provider");

var THROTTLE_TIMEOUT = 150;

var Dashboard = function Dashboard(options) {
  this.options = options || {};
  this.views = {};

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
};

Dashboard.prototype.onEvent = function (event) {
  this.screen.emit(event.type, event.data);
  // avoid double screen render for stream events (Element calls screen.render on scroll)
  // TODO dashboard shouldn't know which events are used by which widgets
  if (event.type === "metrics") {
    this.screen.render();
  }
};

Dashboard.prototype._showLayout = function (id) {
  if (this.currentLayout === id) {
    return;
  }
  _.each(this.views, function (view) {
    view.destroy();
  });

  this.views = [];

  _.each(this.layouts[id], function (layoutConfig) {
    var view;

    switch (layoutConfig.view.type) {
    case "log":
      view = new StreamView({
        parent: this.container,
        logProvider: this.logProvider,
        layoutConfig: layoutConfig
      });
      break;
    case "cpu":
      view = new CpuView({
        parent: this.container,
        metricsProvider: this.metricsProvider,
        layoutConfig: layoutConfig
      });
      break;
    case "memory":
      view = new MemoryView({
        parent: this.container,
        metricsProvider: this.metricsProvider,
        layoutConfig: layoutConfig
      });
      break;
    case "eventLoop":
      view = new EventLoopView({
        parent: this.container,
        metricsProvider: this.metricsProvider,
        layoutConfig: layoutConfig
      });
      break;
    }

    if (view) {
      this.views.push(view);
    }
  }.bind(this));

  this.currentLayout = id;
  this.helpView.node.setFront();
  this.screen.render();
};

module.exports = Dashboard;
