"use strict";

var blessed = require("blessed");
var contrib = require("blessed-contrib");
var expect = require("chai").expect;
var sinon = require("sinon");

var MemoryGaugeView = require("../../../lib/views/memory-gauge-view");
var utils = require("../../utils");
var MetricsProvider = require("../../../lib/providers/metrics-provider");

describe("MemoryGaugeView", function () {

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
      metricsProvider: new MetricsProvider(testContainer.screen),
      layoutConfig: {
        getPosition: sandbox.stub()
      },
      parent: testContainer
    };
  });

  afterEach(function () {
    testContainer.destroy();
    sandbox.restore();
  });

  describe("constructor", function () {

    it("should create a box with two gauges and listen for metrics event", function () {
      var append = sandbox.spy(blessed.node.prototype, "append");

      var memory = new MemoryGaugeView(options);

      expect(memory).to.have.property("node").that.is.an.instanceof(blessed.box);
      expect(memory.node).to.have.deep.property("options.label", " memory ");
      expect(append.thirdCall).to.have.been.calledOn(testContainer)
        .and.calledWithExactly(memory.node);

      expect(testContainer.screen.on).to.have.been.calledWithExactly("metrics", sinon.match.func);

      expect(memory).to.have.property("heapGauge").that.is.an.instanceof(contrib.gauge);
      expect(memory.heapGauge).to.have.deep.property("options.label", "heap");
      expect(append.firstCall).to.have.been.calledOn(memory.node)
        .and.calledWithExactly(memory.heapGauge);

      expect(memory).to.have.property("rssGauge").that.is.an.instanceof(contrib.gauge);
      expect(memory.rssGauge).to.have.deep.property("options.label", "resident");
      expect(append.secondCall).to.have.been.calledOn(memory.node)
        .and.calledWithExactly(memory.rssGauge);
    });
  });

  describe("onEvent", function () {

    it("should call update for each gauge", function () {
      var memory = new MemoryGaugeView(options);

      expect(memory).to.have.property("heapGauge").that.is.an.instanceof(contrib.gauge);
      expect(memory).to.have.property("rssGauge").that.is.an.instanceof(contrib.gauge);

      sandbox.stub(memory, "update");

      var mem = {
        heapUsed: 23,
        heapTotal: 39,
        rss: 290,
        systemTotal: 80010
      };

      memory.onEvent({ mem: mem });

      expect(memory.update).to.have.been.calledTwice
        .and.to.been.calledWithExactly(memory.heapGauge, mem.heapUsed, mem.heapTotal)
        .and.to.been.calledWithExactly(memory.rssGauge, mem.rss, mem.systemTotal);
    });
  });

  describe("update", function () {

    it("should update label and call setPercent for rssGauge", function () {
      var memory = new MemoryGaugeView(options);
      var used = 50000;
      var total = 60300000;
      var pct = Math.floor(100 * used / total); // eslint-disable-line no-magic-numbers

      sandbox.stub(memory.rssGauge, "setPercent");
      memory.update(memory.rssGauge, used, total);

      expect(memory.rssGauge.setPercent).to.have.been.calledOnce.and.calledWithExactly(pct);
      expect(memory.heapGauge.setLabel).to.have.been.calledWithExactly("resident: 50 kB / 60.3 MB");
    });

    it("should update label and call setStack for heapGauge", function () {
      var memory = new MemoryGaugeView(options);
      var used = 500;
      var total = 2500;

      sandbox.stub(memory.heapGauge, "setStack");
      memory.update(memory.heapGauge, used, total);

      expect(memory.heapGauge.setStack).to.have.been.calledOnce
        .and.calledWithExactly([
          { percent: 20, stroke: "red" },
          { percent: 80, stroke: "blue" }
        ]);

      expect(memory.heapGauge.setLabel).to.have.been.calledWithExactly("heap: 500 B / 2.5 kB");
    });
  });
});
