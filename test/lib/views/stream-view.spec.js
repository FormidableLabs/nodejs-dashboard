"use strict";

var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

var blessed = require("blessed");

var StreamView = require("../../../lib/views/stream-view");
var utils = require("../../utils");
var LogProvider = require("../../../lib/providers/log-provider");

describe("StreamView", function () {

  var sandbox;
  var testContainer;
  var options;

  before(function () {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function () {
    utils.stubWidgets(sandbox);
    testContainer = utils.getTestContainer(sandbox);
    options = {
      logProvider: new LogProvider(testContainer.screen),
      layoutConfig: {
        getPosition: sandbox.stub()
      },
      parent: testContainer
    };
    sandbox.stub(StreamView.prototype, "log");
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("constructor", function () {

    it("should require logProvider", function () {
      options.logProvider = undefined;
      expect(function () {
        new StreamView(options); // eslint-disable-line no-new
      }).to.throw("StreamView requires logProvider");
    });

    it("should create a log node and listen for given events", function () {
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
      var streamView = new StreamView(options);

      StreamView.prototype.log.restore();
      sandbox.stub(streamView.node, "log");
      streamView.log("something\nmultiline\n");
      expect(streamView.node.log).to.have.been.calledOnce
        .and.calledWithExactly("something\nmultiline");
    });

    it("should filter logs with include", function () {
      StreamView.prototype.log.restore();

      options.layoutConfig.view = {
        include: "^THIS"
      };
      var streamView = new StreamView(options);
      sandbox.stub(streamView.node, "log");

      streamView.log("THIS should be included\nbut not THIS one\nor that one\n");
      expect(streamView.node.log).to.have.been.calledOnce
        .and.calledWithExactly("THIS should be included");

      options.layoutConfig.view = {
        include: "^THIS(.*)"
      };
      streamView = new StreamView(options);
      sandbox.stub(streamView.node, "log");

      streamView.log("THIS should be included\nbut not THIS one\nor that one\n");
      expect(streamView.node.log).to.have.been.calledOnce
        .and.calledWithExactly(" should be included");
    });

    it("should filter logs with exclude", function () {
      StreamView.prototype.log.restore();

      options.layoutConfig.view = {
        exclude: "^THIS"
      };
      var streamView = new StreamView(options);
      sandbox.stub(streamView.node, "log");

      streamView.log("THIS should be included\nbut not THIS one\nor that one\n");
      expect(streamView.node.log).to.have.been.calledOnce
        .and.calledWithExactly("but not THIS one\nor that one");
    });
  });
});
