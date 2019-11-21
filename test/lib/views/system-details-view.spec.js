"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");

const SystemDetailsView = require("../../../lib/views/system-details-view");
const utils = require("../../utils");

describe("SystemDetailsView", () => {
  let sandbox;
  let testContainer;
  let view;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    utils.stubWidgets(sandbox);
    testContainer = utils.getTestContainer(sandbox);
    view = new SystemDetailsView({
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
      expect(labels).to.eql([
        "Architecture",
        "Endianness",
        "Host Name",
        "Platform",
        "Release",
        "Total Memory",
        "Type"
      ]);
    });
  });
});
