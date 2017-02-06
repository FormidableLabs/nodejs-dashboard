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

  it("should create a box and set up pre-render listener", function () {
    var help = new HelpView({ parent: testContainer });
    expect(help).to.have.property("node").that.is.an.instanceof(blessed.box);
    expect(help.node).to.have.deep.property("options.content").that.contains("keybindings");

    expect(testContainer.screen.on).to.have.been.calledOnce
      .and.calledWithExactly("prerender", sinon.match.func);
  });

  describe("prerender handler", function () {

    var help;
    var prerenderHandler;

    beforeEach(function () {
      help = new HelpView({ parent: testContainer });
      sandbox.spy(help.node, "setFront");
      prerenderHandler = testContainer.screen.on.firstCall.args[1];
    });

    it("should call setFront if node is visible", function () {
      expect(help.node.setFront).to.have.not.been.called;

      // hack to ensure that visible (which can't be set directly) is true
      var el = help.node;
      while (el) {
        el.detached = false;
        el.hidden = false;
        el = el.parent;
      }
      expect(help.node.visible).to.be.true;

      prerenderHandler();
      expect(help.node.setFront).to.have.been.calledOnce;
    });

    it("should do nothing if node is not visible", function () {
      expect(help.node.setFront).to.have.not.been.called;
      expect(help.node.visible).to.be.false;
      prerenderHandler();
      expect(help.node.setFront).to.have.not.been.called;
    });
  });
});
