"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var contrib = require("blessed-contrib");
var _ = require("lodash");

var BaseView = require("../../../lib/views/base-view");
var BaseLineGraph = require("../../../lib/views/base-line-graph");
var utils = require("../../utils");
var MetricsProvider = require("../../../lib/providers/metrics-provider");

describe("BaseLineGraph", function () {

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
      series: {
        a: { label: "" }
      },
      layoutConfig: {
        getPosition: function () { return { top: "10%" }; },
        view: {
          title: "graph A",
          limit: 10
        }
      }
    };
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("constructor", function () {

    beforeEach(function () {
      sandbox.stub(BaseLineGraph.prototype, "_createGraph");
    });

    it("should use limit from layoutConfig", function () {
      var limit = 7;
      options.layoutConfig.view.limit = limit;
      var baseGraph = new BaseLineGraph(options);
      expect(baseGraph).to.have.property("limit", limit);
      expect(baseGraph).to.have.deep.property("series.a.y")
        .that.deep.equals(_.times(limit, _.constant(0)));
    });

    it("should create graph and set up event listener", function () {
      var baseGraph = new BaseLineGraph(options);
      expect(baseGraph).to.be.an.instanceof(BaseView);
      expect(baseGraph._createGraph).to.have.been.calledOnce;
      expect(testContainer.screen.on).to.have.been.calledWithExactly("metrics", sinon.match.func);
    });
  });

  describe("onEvent", function () {

    it("should throw an error because it's meant to be overridden by child class", function () {
      var baseGraph = new BaseLineGraph(options);
      expect(function () {
        baseGraph.onEvent();
      }).to.throw("BaseLineGraph onEvent should be overridden");
    });
  });

  describe("recalculatePosition", function () {

    it("should set new position and recreate node", function () {
      var baseGraph = new BaseLineGraph(options);

      sandbox.spy(testContainer, "remove");
      sandbox.spy(testContainer, "append");
      sandbox.stub(baseGraph, "_getPosition").returns({ top: "20%" });
      baseGraph.recalculatePosition();

      expect(baseGraph.node).to.have.property("position").that.deep.equals({ top: "20%" });
      expect(testContainer.remove).to.have.been.calledOnce;
      expect(testContainer.append).to.have.been.calledOnce;
    });

    it("should do nothing if position is unchanged", function () {
      options.layoutConfig.getPosition = function () { return { top: "10%" }; };
      var baseGraph = new BaseLineGraph(options);
      var originalPosition = baseGraph.node.position;

      sandbox.spy(testContainer, "remove");
      sandbox.stub(baseGraph, "_getPosition").returns({ top: "10%" });
      baseGraph.recalculatePosition();

      expect(baseGraph.node).to.have.property("position", originalPosition);
      expect(testContainer.remove).to.have.not.been.called;
    });
  });

  describe("update", function () {

    /* eslint-disable no-magic-numbers */

    it("should update series and label", function () {
      options.layoutConfig.view.limit = 4;
      options.layoutConfig.view.title = "cpu";
      options.unit = "%";
      var baseGraph = new BaseLineGraph(options);
      expect(baseGraph).to.have.deep.property("series.a.y").that.deep.equals([0, 0, 0, 0]);

      baseGraph.update({ a: 29 });
      expect(baseGraph).to.have.deep.property("series.a.y").that.deep.equals([0, 0, 0, 29]);
      expect(baseGraph.node.setLabel).to.have.been.calledWith(" cpu (29%) ");

      baseGraph.update({ a: 8 });
      expect(baseGraph).to.have.deep.property("series.a.y").that.deep.equals([0, 0, 29, 8]);
      expect(baseGraph.node.setLabel).to.have.been.calledWith(" cpu (8%) ");
    });

    it("should update highwater series", function () {
      options.layoutConfig.view.limit = 3;
      options.series.high = {
        highwater: true
      };
      var baseGraph = new BaseLineGraph(options);

      expect(baseGraph).to.have.deep.property("series.a.y").that.deep.equals([0, 0, 0]);
      expect(baseGraph).to.have.deep.property("series.high").that.deep.equals({
        x: [":02", ":01", ":00"],
        y: [0, 0, 0],
        style: { line: "red" }
      });

      baseGraph.update({ a: 2, high: 4 });
      expect(baseGraph).to.have.deep.property("series.a.y").that.deep.equals([0, 0, 2]);
      expect(baseGraph).to.have.deep.property("series.high").that.deep.equals({
        x: [":02", ":01", ":00"],
        y: [4, 4, 4],
        style: { line: "red" }
      });
      expect(baseGraph.node.setLabel).to.have.been.calledWith(" graph A (2), high (4) ");
    });

    it("should update series without exceeding limit", function () {
      options.layoutConfig.view.limit = 3;
      options.series.high = {
        highwater: true
      };
      var baseGraph = new BaseLineGraph(options);

      baseGraph.update({ a: 27, high: 27 });
      expect(baseGraph).to.have.deep.property("series.a.y").that.deep.equals([0, 0, 27]);
      expect(baseGraph).to.have.deep.property("series.high.y").that.deep.equals([27, 27, 27]);
    });

    /* eslint-enable no-magic-numbers */
  });

  describe("_createGraph", function () {

    it("should create a blessed-contrib line graph", function () {
      sandbox.spy(testContainer, "append");
      options.layoutConfig.view.limit = 8;
      sandbox.stub(BaseLineGraph.prototype, "_createGraph");
      var baseGraph = new BaseLineGraph(options);
      BaseLineGraph.prototype._createGraph.restore();

      expect(baseGraph).to.not.have.property("node");

      baseGraph._createGraph(options);

      expect(baseGraph).to.have.property("node").that.is.an.instanceof(contrib.line);
      expect(baseGraph.node).to.have.deep.property("options.label", " graph A ");
      expect(baseGraph.node).to.have.deep.property("options.maxY", undefined);
      expect(baseGraph.node).to.have.property("position")
        .that.deep.equals(options.layoutConfig.getPosition(options.parent));

      expect(testContainer.append).to.have.been.calledOnce.and.calledWithExactly(baseGraph.node);
    });
  });
});
