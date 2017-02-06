"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var EventLoopView = require("../../../lib/views/eventloop-view");
var BaseLineGraph = require("../../../lib/views/base-line-graph");
var utils = require("../../utils");

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
      limit: 10,
      position: { left: "75%" }
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

      expect(eventLoop).to.have.property("label", "event loop delay");
      expect(eventLoop).to.have.property("unit", "ms");
      expect(eventLoop).to.have.property("highwater", true);
    });
  });

  describe("onEvent", function () {

    it("should call update with event loop delay and high", function () {
      var eventLoop = new EventLoopView(options);
      sandbox.spy(eventLoop, "update");

      var data = { delay: 24, high: 24.346 };
      eventLoop.onEvent({ eventLoop: data });
      expect(eventLoop.update).to.have.been.calledOnce.and.calledWithExactly(data.delay, data.high);
    });
  });
});
