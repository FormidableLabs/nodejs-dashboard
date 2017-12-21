"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var SystemDetailsView = require("../../../lib/views/system-details-view");
var utils = require("../../utils");

describe("SystemDetailsView", function () {

  var sandbox;
  var testContainer;
  var view;

  before(function () {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function () {
    utils.stubWidgets(sandbox);
    testContainer = utils.getTestContainer(sandbox);
    view = new SystemDetailsView({
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
