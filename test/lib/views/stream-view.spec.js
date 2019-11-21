"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");

const blessed = require("blessed");

const StreamView = require("../../../lib/views/stream-view");
const utils = require("../../utils");
const LogProvider = require("../../../lib/providers/log-provider");

describe("StreamView", () => {
  let sandbox;
  let testContainer;
  let options;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
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

  afterEach(() => {
    sandbox.restore();
  });

  describe("constructor", () => {
    it("should require logProvider", () => {
      options.logProvider = undefined;
      expect(() => {
        new StreamView(options); // eslint-disable-line no-new
      }).to.throw("StreamView requires logProvider");
    });

    it("should create a log node and listen for given events", () => {
      const streamView = new StreamView(options);

      expect(streamView).to.have.property("node").that.is.an.instanceof(blessed.log);
      expect(streamView.node).to.have.nested.property("options.label", " stdout / stderr ");
      expect(testContainer.screen.on).to.have.been
        .calledWithExactly("stdout", sinon.match.func)
        .and.calledWithExactly("stderr", sinon.match.func);
    });
  });

  describe("log", () => {
    it("should strip trailing newline before logging data", () => {
      const streamView = new StreamView(options);

      StreamView.prototype.log.restore();
      sandbox.stub(streamView.node, "log");
      streamView.log("something\nmultiline\n");
      expect(streamView.node.log).to.have.been.calledOnce
        .and.calledWithExactly("something\nmultiline");
    });

    it("should filter logs with include", () => {
      StreamView.prototype.log.restore();

      options.layoutConfig.view = {
        include: "^THIS"
      };
      let streamView = new StreamView(options);
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

    it("should filter logs with exclude", () => {
      StreamView.prototype.log.restore();

      options.layoutConfig.view = {
        exclude: "^THIS"
      };
      const streamView = new StreamView(options);
      sandbox.stub(streamView.node, "log");

      streamView.log("THIS should be included\nbut not THIS one\nor that one\n");
      expect(streamView.node.log).to.have.been.calledOnce
        .and.calledWithExactly("but not THIS one\nor that one");
    });
  });
});
