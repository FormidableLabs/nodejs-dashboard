"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");

const BaseView = require("../../../lib/views/base-view");
const utils = require("../../utils");
const blessed = require("blessed");

describe("BaseView", () => {
  let sandbox;
  let testContainer;
  let options;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    testContainer = utils.getTestContainer(sandbox);
    options = {
      parent: testContainer,
      layoutConfig: {
        getPosition: sandbox.stub().returns({ left: 22 })
      }
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("constructor", () => {
    it("should require parent", () => {
      expect(() => {
        new BaseView({}); // eslint-disable-line no-new
      }).to.throw("View requires parent");
    });

    it("should require layoutConfig with getPosition function", () => {
      const msg = "View requires layoutConfig option with getPosition function";
      expect(() => {
        // eslint-disable-next-line no-new
        new BaseView({ parent: testContainer,
          layoutConfig: {} });
      }).to.throw(msg);
    });

    it("should set up resize listener that calls recalculatePosition", () => {
      sandbox.spy(BaseView.prototype, "recalculatePosition");
      const baseView = new BaseView(options);

      expect(testContainer.screen.on).to.have.been.calledOnce
        .and.calledWithExactly("resize", sinon.match.func);

      const resizeHandler = testContainer.screen.on.firstCall.args[1];
      baseView.node = blessed.element();
      resizeHandler();
      expect(baseView.recalculatePosition).to.have.been.calledOnce;
    });
  });

  describe("getPosition", () => {
    it("should return result of layoutConfig getPosition", () => {
      const baseView = new BaseView(options);
      baseView.node = blessed.element();
      expect(options.layoutConfig.getPosition).to.have.not.been.called;

      baseView.recalculatePosition();
      expect(options.layoutConfig.getPosition).to.have.been.calledOnce
        .and.calledWithExactly(testContainer);
      expect(baseView._getPosition(testContainer)).to.equal(
        options.layoutConfig.getPosition.firstCall.returnValue
      );
    });
  });

  describe("recalculatePosition", () => {
    it("should set node position", () => {
      const baseView = new BaseView(options);

      baseView.node = blessed.element();
      const newPosition = { top: "50%" };
      baseView._getPosition = sandbox.stub().returns(newPosition);

      baseView.recalculatePosition();
      expect(baseView.node).to.have.property("position", newPosition);
    });
  });
});
