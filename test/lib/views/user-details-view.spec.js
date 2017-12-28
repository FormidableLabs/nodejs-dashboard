"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var UserDetailsView = require("../../../lib/views/user-details-view");
var utils = require("../../utils");

describe("UserDetailsView", function () {

  var sandbox;
  var testContainer;
  var view;

  before(function () {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function () {
    utils.stubWidgets(sandbox);
    testContainer = utils.getTestContainer(sandbox);
    view = new UserDetailsView({
      layoutConfig: {
        getPosition: sandbox.stub()
      },
      parent: testContainer
    });
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("getDetails", function () {
    it("should include labels", function () {
      var details = view.getDetails();
      expect(details).to.be.an("array");
    });
  });
});
