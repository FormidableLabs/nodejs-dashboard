"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var CpuView = require("../../../lib/views/cpu-view");
var BaseLineGraph = require("../../../lib/views/base-line-graph");
var utils = require("../../utils");
var MetricsProvider = require("../../../lib/providers/metrics-provider");

describe("CpuView", function () {

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

    it("should inherit from BaseLineGraph, with cpu graph options", function () {
      var cpu = new CpuView(options);
      expect(cpu).to.be.an.instanceof(CpuView);
      expect(cpu).to.be.an.instanceof(BaseLineGraph);

      expect(cpu).to.have.property("unit", "%");
      var MAX_PERCENT = 100;
      expect(cpu).to.have.deep.property("node.options.maxY", MAX_PERCENT);
    });
  });

  describe("onEvent", function () {

    it("should call update with formatted cpu utilization", function () {
      var cpu = new CpuView(options);
      sandbox.spy(cpu, "update");

      cpu.onEvent({ cpu: { utilization: 3.24346 } });
      expect(cpu.update).to.have.been.calledOnce.and.calledWithExactly({ cpu: "3.2" });

      cpu.onEvent({ cpu: { utilization: 9 } });
      expect(cpu.update).to.have.been.calledTwice.and.calledWithExactly({ cpu: "9.0" });
    });
  });
});
