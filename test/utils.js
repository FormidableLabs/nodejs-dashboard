"use strict";

var assert = require("assert");
var blessed = require("blessed");
var contrib = require("blessed-contrib");

exports.tryCatch = function (done, func) {
  try {
    func();
    done();
  } catch (err) {
    done(err);
  }
};

exports.getTestContainer = function (sandbox) {
  assert(sandbox, "getTestContainer requires sandbox");

  var mockScreen = {
    on: sandbox.stub(),
    append: sandbox.stub(),
    remove: sandbox.stub(),
    type: "screen",
    setEffects: sandbox.stub(),
    _events: {},
    clickable: [],
    keyable: [],
    rewindFocus: sandbox.stub(),
    _listenKeys: sandbox.stub(),
    _listenMouse: sandbox.stub()
  };
  var container = blessed.box({ parent: mockScreen });
  sandbox.stub(container, "render");
  return container;
};

// stub functions that require an active screen
exports.stubWidgets = function (sandbox) {
  assert(sandbox, "stubWidgets requires sandbox");
  sandbox.stub(blessed.element.prototype, "setContent");
  sandbox.stub(blessed.element.prototype, "setLabel");
  sandbox.stub(contrib.line.prototype, "setData");
  sandbox.stub(contrib.gauge.prototype, "setData");
};
