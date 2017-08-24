"use strict";

var assert = require("assert");
var blessed = require("blessed");
var contrib = require("blessed-contrib");
var EventEmitter = require("events").EventEmitter;

exports.tryCatch = function (done, func) {
  try {
    func();
    done();
  } catch (err) {
    done(err);
  }
};

/**
 * Create the test container.
 *
 * @param {Object} sandbox
 * The sinon sandbox in which to create the container.  It is required.
 *
 * @param {Boolean} stubEvents
 * To keep the screen as a real EventEmitter, set this to falsey.
 *
 * @returns {Object}
 * The test container is returned.
 */
exports.getTestContainer = function (sandbox, stubEvents) {
  assert(sandbox, "getTestContainer requires sandbox");

  var MockProgram = function MockProgram() {
    Object.assign(this, {
      key: blessed.program.prototype.key
    });

    EventEmitter.call(this);
  };

  MockProgram.prototype = Object.create(EventEmitter.prototype);

  var MockScreen = function MockScreen() {
    // organized by primitive, Object, stubs, alphabetically
    Object.assign(this, {
      program: new MockProgram(),
      type: "screen",
      clickable: [],
      keyable: [],
      _listenKeys: blessed.screen.prototype._listenKeys,
      _listenMouse: sandbox.stub(),
      append: sandbox.stub(),
      remove: sandbox.stub(),
      render: sandbox.stub(),
      restoreFocus: sandbox.stub(),
      rewindFocus: sandbox.stub(),
      saveFocus: sandbox.stub(),
      setEffects: sandbox.stub()
    });

    EventEmitter.call(this);

    if (stubEvents === undefined || stubEvents) {
      sandbox.stub(this, "on");
    }
  };

  MockScreen.prototype = Object.create(EventEmitter.prototype);

  var mockScreen = new MockScreen();

  // prevent "Error: no active screen"
  blessed.Screen.total = 1;
  blessed.Screen.global = mockScreen;

  var container = blessed.box({ parent: mockScreen });
  sandbox.stub(container, "render");
  return container;
};

// stub functions that require an active screen
exports.stubWidgets = function (sandbox) {
  assert(sandbox, "stubWidgets requires sandbox");

  sandbox.stub(blessed.element.prototype, "_getHeight");
  sandbox.stub(blessed.element.prototype, "hide");
  sandbox.stub(blessed.element.prototype, "setContent");
  sandbox.stub(blessed.element.prototype, "setFront");
  sandbox.stub(blessed.element.prototype, "setLabel");
  sandbox.stub(blessed.element.prototype, "show");
  sandbox.stub(blessed.element.prototype, "toggle");
  sandbox.stub(blessed.scrollablebox.prototype, "getScrollHeight");
  sandbox.stub(blessed.form.prototype, "cancel");
  sandbox.stub(blessed.form.prototype, "reset");
  sandbox.stub(blessed.form.prototype, "submit");
  sandbox.stub(blessed.button.prototype, "press");
  sandbox.stub(contrib.gauge.prototype, "setData");
  sandbox.stub(contrib.line.prototype, "setData");
};
