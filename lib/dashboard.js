"use strict";

var _ = require("lodash");
var blessed = require("blessed");

var StreamView = require("./views/stream-view");
var EventLoopView = require("./views/eventloop-view");
var MemoryView = require("./views/memory-view");
var CpuView = require("./views/cpu-view");
var HelpView = require("./views/help");
var layouts = require("./layouts");

var Dashboard = function Dashboard(options) {
  this.options = options || {};
  this.views = {};

  this.screen = blessed.screen({
    smartCSR: true,
    title: options.appName
  });

  this._createViews();
  this._configureKeys();
  this.screen.render();
};

Dashboard.prototype._createViews = function () {
  var config = layouts[0];

  // container prevents stream view scrolling from interfering with side views
  this.container = blessed.box();
  this.screen.append(this.container);

  if (this.options.interleave) {
    this.views.stdouterr = new StreamView({
      parent: this.container,
      scrollback: this.options.scrollback,
      events: ["stdout", "stderr"],
      color: "light-blue",
      layoutConfig: config.stdouterr
    });
  } else {
    this.views.stdout = new StreamView({
      parent: this.container,
      scrollback: this.options.scrollback,
      events: ["stdout"],
      color: "green",
      layoutConfig: config.stdout
    });
    this.views.stderr = new StreamView({
      parent: this.container,
      scrollback: this.options.scrollback,
      events: ["stderr"],
      color: "red",
      layoutConfig: config.stderr
    });
  }

  this.views.cpu = new CpuView({
    parent: this.container,
    layoutConfig: config.cpu
  });

  this.views.eventLoop = new EventLoopView({
    parent: this.container,
    layoutConfig: config.eventLoop
  });

  this.views.memory = new MemoryView({
    parent: this.container,
    layoutConfig: config.memory
  });

  this.views.help = new HelpView({
    parent: this.container
  });

  this.currentLayout = 0;
};

Dashboard.prototype._configureKeys = function () {

  this.screen.key(["left", "right"], function (ch, key) {
    var delta = key.name === "left" ? -1 : 1;
    var target = (this.currentLayout + delta + layouts.length) % layouts.length;
    this._showLayout(target);
  }.bind(this));

  this.screen.key("?", this.views.help.node.toggle.bind(this.views.help.node));

  this.screen.key("escape", function () {
    if (this.views.help.node.visible) {
      this.views.help.node.hide();
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
  _.each(this.views, function (v) {
    v.node.hide();
  });
  _.each(layouts[id], function (config, viewName) {
    var view = this.views[viewName];
    if (!view) {
      return;
    }
    if (view.setLayout) {
      view.setLayout(config);
    }
    view.node.show();
  }.bind(this));
  this.currentLayout = id;
  this.screen.render();
};

module.exports = Dashboard;
