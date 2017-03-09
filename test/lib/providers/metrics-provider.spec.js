"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");

var utils = require("../../utils");
var MetricsProvider = require("../../../lib/providers/metrics-provider");

describe("MetricsProvider", function () {

  var sandbox;
  var testContainer;
  var metricsProvider;

  before(function () {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function () {
    testContainer = utils.getTestContainer(sandbox);
    metricsProvider = new MetricsProvider(testContainer.screen);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("should store metrics", function () {
    _.each(["a", "b", "c", "d", "e"], function (data) {
      metricsProvider._onMetrics(data);
    });
    var limit = 3;
    expect(metricsProvider.getMetrics(limit)).to.deep.equal(["c", "d", "e"]);
  });
});
