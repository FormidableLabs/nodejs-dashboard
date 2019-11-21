"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");

const blessed = require("blessed");
const contrib = require("blessed-contrib");

const MemoryGaugeView = require("../../../lib/views/memory-gauge-view");
const utils = require("../../utils");
const MetricsProvider = require("../../../lib/providers/metrics-provider");

describe("MemoryGaugeView", () => {
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
      metricsProvider: new MetricsProvider(testContainer.screen),
      layoutConfig: {
        getPosition: sandbox.stub()
      },
      parent: testContainer
    };
  });

  afterEach(() => {
    testContainer.destroy();
    sandbox.restore();
  });

  describe("constructor", () => {
    it("should create a box with two gauges and listen for metrics event", () => {
      const append = sandbox.spy(blessed.node.prototype, "append");

      const memory = new MemoryGaugeView(options);

      expect(memory).to.have.property("node").that.is.an.instanceof(blessed.box);
      expect(memory.node).to.have.nested.property("options.label", " memory ");
      expect(append.thirdCall).to.have.been.calledOn(testContainer)
        .and.calledWithExactly(memory.node);

      expect(testContainer.screen.on).to.have.been.calledWithExactly("metrics", sinon.match.func);

      expect(memory).to.have.property("heapGauge").that.is.an.instanceof(contrib.gauge);
      expect(memory.heapGauge).to.have.nested.property("options.label", "heap");
      expect(append.firstCall).to.have.been.calledOn(memory.node)
        .and.calledWithExactly(memory.heapGauge);

      expect(memory).to.have.property("rssGauge").that.is.an.instanceof(contrib.gauge);
      expect(memory.rssGauge).to.have.nested.property("options.label", "resident");
      expect(append.secondCall).to.have.been.calledOn(memory.node)
        .and.calledWithExactly(memory.rssGauge);
    });
  });

  describe("onEvent", () => {
    it("should call update for each gauge", () => {
      const memory = new MemoryGaugeView(options);

      expect(memory).to.have.property("heapGauge").that.is.an.instanceof(contrib.gauge);
      expect(memory).to.have.property("rssGauge").that.is.an.instanceof(contrib.gauge);

      sandbox.stub(memory, "update");

      const mem = {
        heapUsed: 23,
        heapTotal: 39,
        rss: 290,
        systemTotal: 80010
      };

      memory.onEvent({ mem });

      expect(memory.update).to.have.been.calledTwice
        .and.to.have.been.calledWithExactly(memory.heapGauge, mem.heapUsed, mem.heapTotal)
        .and.to.have.been.calledWithExactly(memory.rssGauge, mem.rss, mem.systemTotal);
    });
  });

  describe("update", () => {
    it("should update label and call setPercent for rssGauge", () => {
      const memory = new MemoryGaugeView(options);
      const used = 50000;
      const total = 60300000;
      const pct = Math.floor(100 * used / total); // eslint-disable-line no-magic-numbers

      sandbox.stub(memory.rssGauge, "setPercent");
      memory.update(memory.rssGauge, used, total);

      expect(memory.rssGauge.setPercent).to.have.been.calledOnce.and.calledWithExactly(pct);
      expect(memory.heapGauge.setLabel).to.have.been.calledWithExactly("resident: 50 kB / 60.3 MB");
    });

    it("should update label and call setStack for heapGauge", () => {
      const memory = new MemoryGaugeView(options);
      const used = 500;
      const total = 2500;

      sandbox.stub(memory.heapGauge, "setStack");
      memory.update(memory.heapGauge, used, total);

      expect(memory.heapGauge.setStack).to.have.been.calledOnce
        .and.calledWithExactly([
          { percent: 20,
            stroke: "red" },
          { percent: 80,
            stroke: "blue" }
        ]);

      expect(memory.heapGauge.setLabel).to.have.been.calledWithExactly("heap: 500 B / 2.5 kB");
    });
  });
});
