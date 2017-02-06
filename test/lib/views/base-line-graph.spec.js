"use strict";

var contrib = require("blessed-contrib");
var expect = require("chai").expect;
var _ = require("lodash");
var sinon = require("sinon");

var BaseLineGraph = require("../../../lib/views/base-line-graph");
var utils = require("../../utils");

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
      limit: 10,
      label: "graph A",
      position: { left: "75%" }
    };
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("constructor", function () {

    beforeEach(function () {
      sandbox.stub(BaseLineGraph.prototype, "_createGraph");
    });

    it("should accept limit option", function () {
      var limit = 22;
      var baseGraph = new BaseLineGraph(_.merge(options, { limit: limit }));
      expect(baseGraph).to.have.property("limit", limit);
      expect(baseGraph).to.have.property("maxLimit", limit);
      expect(baseGraph).to.have.property("values").that.deep.equals(_.times(limit, _.constant(0)));
    });

    it("should create graph and set up event listener", function () {
      var baseGraph = new BaseLineGraph(options);
      expect(baseGraph._createGraph).to.have.been.calledOnce;
      expect(testContainer.screen.on).to.have.been.calledWithExactly("metrics", sinon.match.func);
    });
  });

  describe("onEvent", function () {

    it("should throw an error because it's meant to be overwritten by child class", function () {
      var baseGraph = new BaseLineGraph(options);
      expect(function () {
        baseGraph.onEvent();
      }).to.throw("BaseLineGraph onEvent should be overwritten");
    });
  });

  describe("resize", function () {

    it("should call _setLimit and _setPosition", function () {
      var baseGraph = new BaseLineGraph(options);
      sandbox.spy(baseGraph, "_setLimit");
      sandbox.spy(baseGraph, "_setPosition");
      var position = { left: "75%" };
      var limit = 10;
      baseGraph.resize(position, limit);
      expect(baseGraph._setPosition).to.have.been.calledOnce.and.calledWithExactly(position);
      expect(baseGraph._setLimit).to.have.been.calledOnce.and.calledWithExactly(limit);
    });
  });

  describe("_setPosition", function () {

    it("should set new position and recreate node", function () {
      var baseGraph = new BaseLineGraph(options);

      sandbox.stub(baseGraph, "_createGraph");
      sandbox.spy(testContainer, "remove");
      var newPosition = { top: "20%" };
      baseGraph._setPosition(newPosition);

      expect(baseGraph).to.have.property("position", newPosition);
      expect(testContainer.remove).to.have.been.calledOnce;
      expect(baseGraph._createGraph).to.have.been.calledOnce;
    });

    it("should do nothing if position is undefined", function () {
      var baseGraph = new BaseLineGraph(options);
      var originalPosition = baseGraph.position;

      sandbox.stub(baseGraph, "_createGraph");
      baseGraph._setPosition();

      expect(baseGraph).to.have.property("position", originalPosition);
      expect(baseGraph._createGraph).to.have.not.been.called;
    });

    it("should do nothing if position is unchanged", function () {
      options.position = { top: "10%" };
      var baseGraph = new BaseLineGraph(options);
      var originalPosition = baseGraph.position;

      sandbox.stub(baseGraph, "_createGraph");
      baseGraph._setPosition({ top: "10%" });

      expect(baseGraph).to.have.property("position", originalPosition);
      expect(baseGraph._createGraph).to.have.not.been.called;
    });
  });

  describe("_setLimit", function () {

    it("should update limit and backfill values", function () {
      options.limit = 3;
      var baseGraph = new BaseLineGraph(options);
      baseGraph.values = [8, 7, 6]; // eslint-disable-line no-magic-numbers

      var newLimit = 7;
      baseGraph._setLimit(newLimit);

      expect(baseGraph).to.have.property("limit", newLimit);
      expect(baseGraph).to.have.property("maxLimit", newLimit);
      // eslint-disable-next-line no-magic-numbers
      expect(baseGraph).to.have.property("values").that.deep.equals([ 0, 0, 0, 0, 8, 7, 6 ]);
    });

    it("should do nothing if limit is undefined", function () {
      var limit = 7;
      options.limit = limit;
      var baseGraph = new BaseLineGraph(options);
      var originalValues = baseGraph.values;

      sandbox.stub(Math, "max");
      baseGraph._setLimit();

      expect(baseGraph).to.have.property("limit", limit);
      expect(baseGraph).to.have.property("maxLimit", limit);
      expect(baseGraph).to.have.property("values", originalValues);
      expect(Math.max).to.have.not.been.called;
    });

    it("should do nothing if limit is unchanged", function () {
      var limit = 7;
      options.limit = limit;
      var baseGraph = new BaseLineGraph(options);
      var originalValues = baseGraph.values;

      sandbox.stub(Math, "max");
      baseGraph._setLimit(limit);

      expect(baseGraph).to.have.property("limit", limit);
      expect(baseGraph).to.have.property("maxLimit", limit);
      expect(baseGraph).to.have.property("values", originalValues);
      expect(Math.max).to.have.not.been.called;
    });
  });

  describe("update", function () {

    /* eslint-disable no-magic-numbers */

    it("should update values and label", function () {
      options.limit = 4;
      options.label = "cpu";
      options.unit = "%";
      var baseGraph = new BaseLineGraph(options);
      expect(baseGraph).to.have.property("values").that.deep.equals([0, 0, 0, 0]);
      expect(baseGraph).to.have.deep.property("series.y").that.deep.equals(baseGraph.values);

      baseGraph.update(29);
      expect(baseGraph).to.have.property("values").that.deep.equals([0, 0, 0, 29]);
      expect(baseGraph).to.have.deep.property("series.y").that.deep.equals(baseGraph.values);
      expect(baseGraph.node.setLabel).to.have.been.calledWith(" cpu (29%) ");

      baseGraph.update(8);
      expect(baseGraph).to.have.property("values").that.deep.equals([0, 0, 29, 8]);
      expect(baseGraph).to.have.deep.property("series.y").that.deep.equals(baseGraph.values);
      expect(baseGraph.node.setLabel).to.have.been.calledWith(" cpu (8%) ");
    });

    it("should update highwater series", function () {
      options.limit = 3;
      options.highwater = true;
      var baseGraph = new BaseLineGraph(options);

      expect(baseGraph).to.have.property("values").that.deep.equals([0, 0, 0]);
      expect(baseGraph).to.have.property("highwaterSeries").that.deep.equals({
        x: ["2", "1", "0"],
        style: { line: "red" }
      });

      baseGraph.update(2, 4);
      expect(baseGraph).to.have.property("values").that.deep.equals([0, 0, 2]);
      expect(baseGraph).to.have.property("highwaterSeries").that.deep.equals({
        x: ["2", "1", "0"],
        y: [4, 4, 4],
        style: { line: "red" }
      });
      expect(baseGraph.node.setLabel).to.have.been.calledWith(" graph A (2), high (4) ");
    });

    it("should update series correctly when values length > limit", function () {
      options.limit = 5;
      options.highwater = true;
      var baseGraph = new BaseLineGraph(options);
      baseGraph._setLimit(3);
      baseGraph.update(27);
      expect(baseGraph).to.have.property("values").that.deep.equals([0, 0, 0, 0, 27]);
      expect(baseGraph).to.have.deep.property("series.y").that.deep.equals([0, 0, 27]);
    });

    /* eslint-enable no-magic-numbers */
  });

  describe("_createGraph", function () {

    it("should create a blessed-contrib line graph", function () {
      sandbox.spy(testContainer, "append");
      options.limit = 8;
      sandbox.stub(BaseLineGraph.prototype, "_createGraph");
      var baseGraph = new BaseLineGraph(options);
      BaseLineGraph.prototype._createGraph.restore();

      expect(baseGraph).to.not.have.property("node");

      baseGraph._createGraph();

      expect(baseGraph).to.have.property("node").that.is.an.instanceof(contrib.line);
      expect(baseGraph.node).to.have.deep.property("options.label", " graph A ");
      expect(baseGraph.node).to.have.deep.property("options.position", options.position);
      expect(baseGraph.node).to.have.deep.property("options.maxY", undefined);

      expect(testContainer.append).to.have.been.calledOnce.and.calledWithExactly(baseGraph.node);
    });

    it("should create a series and trim values based on limit", function () {
      sandbox.stub(BaseLineGraph.prototype, "_createGraph");
      options.limit = 4;
      var baseGraph = new BaseLineGraph(options);
      BaseLineGraph.prototype._createGraph.restore();

      baseGraph.values = [2, 3, 4, 5, 6, 7, 8, 9]; // eslint-disable-line no-magic-numbers

      baseGraph._createGraph();

      expect(baseGraph).to.have.property("series").that.deep.equals({
        x: ["3", "2", "1", "0"],
        y: [6, 7, 8, 9] // eslint-disable-line no-magic-numbers
      });

      expect(baseGraph.node.setData).to.have.been.calledOnce
        .and.calledWithExactly([baseGraph.series]);
    });

    it("should initialize highwater series if option is set", function () {
      sandbox.stub(BaseLineGraph.prototype, "_createGraph");
      options.highwater = true;
      var baseGraph = new BaseLineGraph(options);
      BaseLineGraph.prototype._createGraph.restore();

      expect(baseGraph).to.not.have.property("highwaterSeries");
      baseGraph._createGraph();

      expect(baseGraph).to.have.property("highwaterSeries").that.deep.equals({
        x: ["9", "8", "7", "6", "5", "4", "3", "2", "1", "0"],
        style: { line: "red" }
      });

      expect(baseGraph.node.setData).to.have.been.calledOnce
        .and.calledWithExactly([baseGraph.series]);
    });
  });
});
