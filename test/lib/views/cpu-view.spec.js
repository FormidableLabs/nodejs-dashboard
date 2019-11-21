"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");

const CpuView = require("../../../lib/views/cpu-view");
const BaseLineGraph = require("../../../lib/views/base-line-graph");
const utils = require("../../utils");
const MetricsProvider = require("../../../lib/providers/metrics-provider");

describe("CpuView", () => {
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
    it("should inherit from BaseLineGraph, with cpu graph options", () => {
      const cpu = new CpuView(options);
      expect(cpu).to.be.an.instanceof(CpuView);
      expect(cpu).to.be.an.instanceof(BaseLineGraph);

      expect(cpu).to.have.property("unit", "%");
      const MAX_PERCENT = 100;
      expect(cpu).to.have.nested.property("node.options.maxY", MAX_PERCENT);
    });
  });

  describe("onEvent", () => {
    it("should call update with formatted cpu utilization", () => {
      const cpu = new CpuView(options);
      sandbox.spy(cpu, "update");

      cpu.onEvent({ cpu: { utilization: 3.24346 } });
      expect(cpu.update).to.have.been.calledOnce.and.calledWithExactly({ cpu: "3.2" });

      cpu.onEvent({ cpu: { utilization: 9 } });
      expect(cpu.update).to.have.been.calledTwice.and.calledWithExactly({ cpu: "9.0" });
    });
  });
});
