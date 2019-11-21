"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");

const UserDetailsView = require("../../../lib/views/user-details-view");
const utils = require("../../utils");

describe("UserDetailsView", () => {
  let sandbox;
  let testContainer;
  let view;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    utils.stubWidgets(sandbox);
    testContainer = utils.getTestContainer(sandbox);
    view = new UserDetailsView({
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
