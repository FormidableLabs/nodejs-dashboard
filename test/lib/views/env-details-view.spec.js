"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");

const EnvDetailsView = require("../../../lib/views/env-details-view");
const utils = require("../../utils");

describe("EnvDetailsView", () => {
  let sandbox;
  let testContainer;
  let view;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    utils.stubWidgets(sandbox);
    testContainer = utils.getTestContainer(sandbox);
    view = new EnvDetailsView({
      layoutConfig: {
        getPosition: sandbox.stub()
      },
      parent: testContainer
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("getDetails", () => {
    it("should include labels", () => {
      const details = view.getDetails();
      expect(details).to.be.an("array");
    });
  });
});
