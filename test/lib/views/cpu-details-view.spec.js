"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var CpuDetailsView = require("../../../lib/views/cpu-details-view");
var utils = require("../../utils");

describe("CpuDetailsView", function () {

  var sandbox;
  var testContainer;
  var view;

  before(function () {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function () {
    utils.stubWidgets(sandbox);
    testContainer = utils.getTestContainer(sandbox);
    view = new CpuDetailsView({
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
      var labels = details.map(function (detail) {
        return detail.label;
      }).sort();
      expect(labels).to.include("[0]");
    });
  });
});
