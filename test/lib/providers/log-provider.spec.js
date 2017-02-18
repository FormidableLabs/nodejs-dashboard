"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var utils = require("../../utils");
var LogProvider = require("../../../lib/providers/log-provider");

describe("LogProvider", function () {

  var sandbox;
  var testContainer;
  var logProvider;

  before(function () {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function () {
    testContainer = utils.getTestContainer(sandbox);
    logProvider = new LogProvider(testContainer.screen);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("should store logs", function () {
    logProvider._onLog("stdout", "a\n");
    logProvider._onLog("stderr", "b\n");
    logProvider._onLog("stdout", "c\n");
    logProvider._onLog("stderr", "d\n");
    expect(logProvider.getLog("stdout")).to.equal("a\nc");
    expect(logProvider.getLog("stderr")).to.equal("b\nd");
  });
});
