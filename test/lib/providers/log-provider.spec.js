"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");

const utils = require("../../utils");
const LogProvider = require("../../../lib/providers/log-provider");

describe("LogProvider", () => {
  let sandbox;
  let testContainer;
  let logProvider;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    testContainer = utils.getTestContainer(sandbox);
    logProvider = new LogProvider(testContainer.screen);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should store logs", () => {
    logProvider._onLog("stdout", "a\n");
    logProvider._onLog("stderr", "b\n");
    logProvider._onLog("stdout", "c\n");
    logProvider._onLog("stderr", "d\n");
    expect(logProvider.getLog("stdout")).to.equal("a\nc");
    expect(logProvider.getLog("stderr")).to.equal("b\nd");
  });
});
