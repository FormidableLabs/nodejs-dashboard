"use strict";

var blessed = require("blessed");
var expect = require("chai").expect;
var sinon = require("sinon");

var HelpView = require("../../../lib/views/help");
var utils = require("../../utils");

describe("HelpView", function () {

  var sandbox;
  var testContainer;

  before(function () {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function () {
    utils.stubWidgets(sandbox);
    testContainer = utils.getTestContainer(sandbox);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("should create a box with text describing keybindings", function () {
    var help = new HelpView({ parent: testContainer });
    expect(help).to.have.property("node").that.is.an.instanceof(blessed.box);
    expect(help.node).to.have.deep.property("options.content").that.contains("keybindings");
    expect(help.node).to.have.property("hidden", true);
  });
});
