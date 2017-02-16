"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var BaseView = require("../../../lib/views/base-view");
var utils = require("../../utils");
var blessed = require("blessed");

describe("BaseView", function () {

  var sandbox;
  var testContainer;
  var options;

  before(function () {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function () {
    testContainer = utils.getTestContainer(sandbox);
    options = {
      parent: testContainer,
      layoutConfig: {
        getPosition: sandbox.stub().returns({ left: 22 })
      }
    };
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("constructor", function () {

    it("should require parent", function () {
      expect(function () {
        new BaseView({}); // eslint-disable-line no-new
      }).to.throw("View requires parent");
    });

    it("should require layoutConfig with getPosition function", function () {
      var msg = "View requires layoutConfig option with getPosition function";
      expect(function () {
        new BaseView({ parent: testContainer, layoutConfig: {} }); // eslint-disable-line no-new
      }).to.throw(msg);
    });

    it("should set up resize listener that calls recalculatePosition", function () {
      sandbox.spy(BaseView.prototype, "recalculatePosition");
      var baseView = new BaseView(options);

      expect(testContainer.screen.on).to.have.been.calledOnce
        .and.calledWithExactly("resize", sinon.match.func);

      var resizeHandler = testContainer.screen.on.firstCall.args[1];
      baseView.node = blessed.element();
      resizeHandler();
      expect(baseView.recalculatePosition).to.have.been.calledOnce;
    });
  });

  describe("getPosition", function () {

    it("should return result of layoutConfig getPosition", function () {
      var baseView = new BaseView(options);
      expect(options.layoutConfig.getPosition).to.have.not.been.called;

      var pos = baseView.getPosition();
      expect(baseView.layoutConfig.getPosition).to.have.been.calledOnce
        .and.calledWithExactly(testContainer);
      expect(pos).to.equal(baseView.layoutConfig.getPosition.firstCall.returnValue);
    });
  });

  describe("recalculatePosition", function () {

    it("should set node position", function () {
      var baseView = new BaseView(options);

      baseView.node = blessed.element();
      var newPosition = { top: "50%" };
      sandbox.stub(baseView, "getPosition").returns(newPosition);

      baseView.recalculatePosition();
      expect(baseView.node).to.have.property("position", newPosition);
    });
  });

  describe("setLayout", function () {

    it("should set layoutConfig property and call recalculatePosition", function () {
      var baseView = new BaseView(options);
      var layoutConfig = {};
      sandbox.stub(baseView, "recalculatePosition");

      expect(function () {
        baseView.setLayout(layoutConfig);
      }).to.throw("View requires layoutConfig option with getPosition function");

      layoutConfig = { getPosition: function () {} };

      baseView.setLayout(layoutConfig);

      expect(baseView.layoutConfig).to.equal(layoutConfig);
      expect(baseView.recalculatePosition).to.have.been.calledOnce;
    });
  });
});
