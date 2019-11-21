"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");

const CpuDetailsView = require("../../../lib/views/cpu-details-view");
const utils = require("../../utils");

describe("CpuDetailsView", () => {
  let sandbox;
  let testContainer;
  let view;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    utils.stubWidgets(sandbox);
    testContainer = utils.getTestContainer(sandbox);
    view = new CpuDetailsView({
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
      const labels = details.map((detail) => detail.label).sort();
      expect(labels).to.include("[0]");
    });
  });
});
