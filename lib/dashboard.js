"use strict";

var _ = require("lodash");
var blessed = require("blessed");
var HelpView = require("./views/help");
var generateLayouts = require("./generate-layouts");
var LogProvider = require("./providers/log-provider");
var MetricsProvider = require("./providers/metrics-provider");
var GotoTimeView = require("./views/goto-time-view");
var views = require("./views");

var THROTTLE_TIMEOUT = 150;

var Dashboard = function Dashboard(options) {
  this.options = options || {};
  this.settings = this.options.settings;

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

  // container prevents stream view scrolling from interfering with side views
  this.container = blessed.box();
  this.screen.append(this.container);
  this.viewOptions = {
    screen: this.screen,
    parent: this.container,
    logProvider: this.logProvider,
    metricsProvider: this.metricsProvider
  };

  this.helpView = new HelpView(this.viewOptions);
  this.gotoTimeView = new GotoTimeView(this.viewOptions);

  this._showLayout(0);
};

Dashboard.prototype._configureKeys = function () {
  // ignore locked works like a global key handler regardless of input
  // this key will be watched on the global screen
  this.screen.ignoreLocked = ["C-c"];
  this.screen.key("C-c", function () {
    process.kill(process.pid, "SIGINT");
  });

  // watch for key events on the main container; not the screen
  // this allows for more granular key bindings in other views
  this.container.key(["left", "right"], _.throttle(function (ch, key) {
    var delta = key.name === "left" ? -1 : 1;
    var target = (this.currentLayout + delta + this.layouts.length) % this.layouts.length;
    this._showLayout(target);
  }.bind(this), THROTTLE_TIMEOUT));

  this.container.key(["?", "h", "S-h"], function () {
    this.gotoTimeView.hide();
    this.helpView.toggle();
    this.screen.render();
  }.bind(this));

  this.container.key(["g", "S-g"], function () {
    this.helpView.hide();
    this.gotoTimeView.toggle();
    this.screen.render();
  }.bind(this));

  this.container.key("escape", function () {
    if (this.helpView.isVisible() || this.gotoTimeView.isVisible()) {
      this.helpView.hide();
      this.gotoTimeView.hide();
      this.screen.render();
    } else {
      this.screen.emit("resetGraphs");
      this._showLayout(0);
    }
  }.bind(this));

  this.container.key(["q", "S-q"], function () {
    process.exit(0); // eslint-disable-line no-process-exit
  });

  this.container.key(["w", "S-w", "s", "S-s"], function (ch, key) {
    var zoom = key.name === "s" ? -1 : 1;
    this.screen.emit("zoomGraphs", zoom);
    this.screen.render();
  }.bind(this));

  this.container.key(["a", "S-a", "d", "S-d"], function (ch, key) {
    var scroll = key.name === "a" ? -1 : 1;
    this.screen.emit("scrollGraphs", scroll);
    this.screen.render();
  }.bind(this));

  this.container.key(["z", "S-z", "x", "S-x"], function (ch, key) {
    var goto = key.name === "z" ? -1 : 1;
    this.screen.emit("startGraphs", goto);
    this.screen.render();
  }.bind(this));
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

  // Remove current layout
  if (this.panel) {
    this.panel.destroy();
    delete this.panel;
  }

  // create new layout
  this.panel = views.create(this.layouts[id], this.viewOptions, this.settings);

  this.currentLayout = id;
  this.helpView.node.setFront();
  this.screen.render();
};

module.exports = Dashboard;
