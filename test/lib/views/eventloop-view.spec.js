"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");

const BaseView = require("../../../lib/views/base-view");
const BaseLineGraph = require("../../../lib/views/base-line-graph");
const EventLoopView = require("../../../lib/views/eventloop-view");
const utils = require("../../utils");
const MetricsProvider = require("../../../lib/providers/metrics-provider");

describe("EventLoopView", () => {
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
      parent: testContainer,
      metricsProvider: new MetricsProvider(testContainer.screen),
      layoutConfig: {
        limit: 10,
        getPosition: sandbox.stub().returns({ left: "75%" })
      }
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("constructor", () => {
    it("should inherit from BaseLineGraph, with eventLoop graph options", () => {
      const eventLoop = new EventLoopView(options);
      expect(eventLoop).to.be.an.instanceof(EventLoopView);
      expect(eventLoop).to.be.an.instanceof(BaseLineGraph);
      expect(eventLoop).to.be.an.instanceof(BaseView);

      expect(eventLoop).to.have.property("label", " event loop ");
      expect(eventLoop).to.have.property("unit", "ms");
      expect(eventLoop).to.have.property("series").that.has.keys("delay", "high");
    });
  });

  describe("onEvent", () => {
    it("should call update with event loop delay and high", () => {
      const eventLoop = new EventLoopView(options);
      sandbox.spy(eventLoop, "update");

      const data = { delay: 24,
        high: 24.346 };
      eventLoop.onEvent({ eventLoop: data });
      expect(eventLoop.update).to.have.been.calledOnce
        .and.calledWithExactly({ delay: data.delay,
          high: data.high });
    });
  });
});
