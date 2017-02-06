"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");
var blessed = require("blessed");

var StreamView = require("../../../lib/views/stream-view");
var utils = require("../../utils");

describe("StreamView", function () {

  var sandbox;
  var testContainer;

  before(function () {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function () {
    testContainer = utils.getTestContainer(sandbox);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("constructor", function () {

    it("should create a log node and listen for given events", function () {

      var streamView = new StreamView({
        parent: testContainer,
        events: ["stdout", "stderr"],
        position: {}
      });

      expect(streamView).to.have.property("node").that.is.an.instanceof(blessed.log);
      expect(streamView.node).to.have.deep.property("options.label", " stdout / stderr ");
      expect(testContainer.screen.on).to.have.been.calledTwice
        .and.calledWithExactly("stdout", sinon.match.func)
        .and.calledWithExactly("stderr", sinon.match.func);
    });
  });

  describe("resize", function () {

    it("should set new position on node and call parent render", function () {
      var streamView = new StreamView({
        parent: testContainer,
        events: ["stdout", "stderr"],
        position: {}
      });
      expect(testContainer.render).to.have.not.been.called;

      var newPosition = { left: "30%" };
      streamView.resize(newPosition);

      expect(streamView.node).to.have.property("position", newPosition);
      expect(testContainer.render).to.have.been.calledOnce;
    });
  });
});
