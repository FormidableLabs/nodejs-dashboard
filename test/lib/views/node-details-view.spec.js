"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");

const NodeDetailsView = require("../../../lib/views/node-details-view");
const utils = require("../../utils");

describe("NodeDetailsView", () => {
  let sandbox;
  let testContainer;
  let view;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    utils.stubWidgets(sandbox);
    testContainer = utils.getTestContainer(sandbox);
    view = new NodeDetailsView({
      layoutConfig: {
        getPosition: sandbox.stub()
      },
      parent: testContainer
    });
  });

  afterEach(() => {
    // Need to detach the node to clean up and not hang the tests.
    view.node.emit("detach");
    sandbox.restore();
  });

  describe("getDetails", () => {
    it("should include labels", () => {
      const details = view.getDetails();
      expect(details).to.be.an("array");
      const labels = details.map((detail) => detail.label).sort();
      expect(labels).to.eql([
        "LTS",
        "Uptime",
        "Version"
      ]);
    });
  });
});
