"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var BaseView = require("../../../lib/views/base-view");
var BaseLineGraph = require("../../../lib/views/base-line-graph");
var EventLoopView = require("../../../lib/views/eventloop-view");
var utils = require("../../utils");
var MetricsProvider = require("../../../lib/providers/metrics-provider");

describe("EventLoopView", function () {

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
      parent: testContainer,
      metricsProvider: new MetricsProvider(testContainer.screen),
      layoutConfig: {
        limit: 10,
        getPosition: sandbox.stub().returns({ left: "75%" })
      }
    };
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("constructor", function () {

    it("should inherit from BaseLineGraph, with eventLoop graph options", function () {
      var eventLoop = new EventLoopView(options);
      expect(eventLoop).to.be.an.instanceof(EventLoopView);
      expect(eventLoop).to.be.an.instanceof(BaseLineGraph);
      expect(eventLoop).to.be.an.instanceof(BaseView);

      expect(eventLoop).to.have.property("label", "event loop");
      expect(eventLoop).to.have.property("unit", "ms");
      expect(eventLoop).to.have.property("series").that.has.keys("delay", "high");
    });
  });

  describe("onEvent", function () {

    it("should call update with event loop delay and high", function () {
      var eventLoop = new EventLoopView(options);
      sandbox.spy(eventLoop, "update");

      var data = { delay: 24, high: 24.346 };
      eventLoop.onEvent({ eventLoop: data });
      expect(eventLoop.update).to.have.been.calledOnce
        .and.calledWithExactly({ delay: data.delay, high: data.high });
    });
  });
});
