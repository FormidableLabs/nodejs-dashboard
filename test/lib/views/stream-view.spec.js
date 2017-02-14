"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");
var blessed = require("blessed");

var StreamView = require("../../../lib/views/stream-view");
var utils = require("../../utils");

describe("StreamView", function () {

  var sandbox;
  var testContainer;
  var options;

  before(function () {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function () {
    testContainer = utils.getTestContainer(sandbox);
    options = {
      layoutConfig: {
        getPosition: sandbox.stub()
      },
      parent: testContainer
    };
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("constructor", function () {

    it("should require events option", function () {
      expect(function () {
        new StreamView(options); // eslint-disable-line no-new
      }).to.throw("StreamView requires array of events to log");
    });

    it("should create a log node and listen for given events", function () {
      options.events = ["stdout", "stderr"];
      var streamView = new StreamView(options);

      expect(streamView).to.have.property("node").that.is.an.instanceof(blessed.log);
      expect(streamView.node).to.have.deep.property("options.label", " stdout / stderr ");
      expect(testContainer.screen.on).to.have.been
        .calledWithExactly("stdout", sinon.match.func)
        .and.calledWithExactly("stderr", sinon.match.func);
    });
  });

  describe("log", function () {

    it("should strip trailing newline before logging data", function () {
      options.events = ["stdout"];
      var streamView = new StreamView(options);

      sandbox.stub(streamView.node, "log");
      streamView.log("something\nmultiline\n");
      expect(streamView.node.log).to.have.been.calledOnce
        .and.calledWithExactly("something\nmultiline");
    });
  });
});
