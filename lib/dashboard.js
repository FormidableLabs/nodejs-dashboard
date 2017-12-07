"use strict";

var _ = require("lodash");
var blessed = require("blessed");

var generateLayouts = require("./generate-layouts");
var LogProvider = require("./providers/log-provider");
var MetricsProvider = require("./providers/metrics-provider");
var Modals = require("./modals");
var views = require("./views");

var THROTTLE_TIMEOUT = 150;
var DEFAULT_OPTIONS = {
  appName: "",
  layoutsFile: "",
  settings: {}
};

var Dashboard = function Dashboard(options) {
  var opts = Object.assign({}, DEFAULT_OPTIONS, options);
  this.settings = opts.settings;
  this.screen = blessed.screen({
    smartCSR: true,
    title: opts.appName
  });
  this.layouts = generateLayouts(opts.layoutsFile);

  this.logProvider = new LogProvider(this.screen);
  this.metricsProvider = new MetricsProvider(this.screen);
  // container prevents stream view scrolling from interfering with side views
  this.container = blessed.box();
  this.screen.append(this.container);
  this.modals = new Modals({
    metricsProvider: this.metricsProvider,
    parent: this.container,
    screen: this.screen
  });
  this.keyActions = this._getKeyActions().concat(this.modals.getKeyActions());
  this._configureKeys();

  this._showLayout(0);
  this.screen.render();
};

Dashboard.prototype._configureKeys = function () {
  // ignore locked works like a global key handler regardless of input
  // this key will be watched on the global screen
  this.screen.ignoreLocked = ["C-c"];
  this.screen.key("C-c", process.exit.bind(null, 0)); // eslint-disable-line no-process-exit

  // add key to container for all keyActions
  var rerender = this.screen.render.bind(this.screen);
  var addKey = this.container.key.bind(this.container);
  _.each(this.keyActions, function (keyAction) {
    _.each(keyAction.keys, function (keyFull) {
      addKey(keyFull, function (ch, key) {
        keyAction.action(ch, key);
        rerender();
      });
    });
  });
};

Dashboard.prototype._rollLayout = function (ch, key) {
  var delta = key.name === "left" ? -1 : 1;
  var target = (this.currentLayout + delta + this.layouts.length) % this.layouts.length;
  this._showLayout(target);
};

Dashboard.prototype._resetDisplay = function () {
  if (this.modals.showingModal()) {
    this.modals.hideModals();
  } else {
    this.screen.emit("resetGraphs");
    this._showLayout(0);
  }
};

Dashboard.prototype._zoomGraphs = function (ch, key) {
  var zoom = key.name === "s" ? -1 : 1;
  this.screen.emit("zoomGraphs", zoom);
};

Dashboard.prototype._scrollGraphs = function (ch, key) {
  var scroll = key.name === "a" ? -1 : 1;
  this.screen.emit("scrollGraphs", scroll);
};

Dashboard.prototype._startGraphs = function (ch, key) {
  var goto = key.name === "z" ? -1 : 1;
  this.screen.emit("startGraphs", goto);
};

Dashboard.prototype._getKeyActions = function () {
  return [
    {
      keys: ["left", "right"],
      action: _.throttle(this._rollLayout.bind(this), THROTTLE_TIMEOUT)
    },
    {
      keys: ["w", "S-w", "s", "S-s"],
      action: this._zoomGraphs.bind(this)
    },
    {
      keys: ["a", "S-a", "d", "S-d"],
      action: this._scrollGraphs.bind(this)
    },
    {
      keys: ["z", "S-z", "x", "S-x"],
      action: this._startGraphs.bind(this)
    },
    {
      keys: ["q", "S-q", "C-c"],
      action: process.exit.bind(null, 0) }, // eslint-disable-line no-process-exit
    {
      keys: ["escape"],
      action: this._resetDisplay.bind(this)
    }
  ];
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

  // clear focus state and set to main container
  while (this.screen.focusPop()) { /* no action necessary */ }
  this.screen.focusPush(this.container);

  // reset views if any present
  if (this.clearView) {
    this.clearView();
  }

  // create all views in layout
  var items = _.reduce(this.layouts[id], function (memo, layoutConfig) {
    var View = views.getConstructor(layoutConfig.view);
    if (View) {
      // As needed apply custom view to layout config
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
      memo.push(view);
    }
    return memo;
  }.bind(this), []);

  // Save reset for next layout change
  this.clearView = function () {
    _.each(items, function (item) { item.destroy(); });
  };
  this.currentLayout = id;

  this.modals.bringShowingToFront();
};

module.exports = Dashboard;
