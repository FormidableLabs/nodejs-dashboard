/* eslint-disable strict, no-magic-numbers */

var expect = require("chai").expect;

// Strict mode leads to odd bug in Node < 0.12
var mockRequire = require("mock-require");

// to ensure cross-platform consistency with mixed Posix & Win32 paths, use path.resolve()
var resolve = require("path").resolve;

var mock = function (path, obj) {
  return mockRequire(resolve(path), obj);
};

var generateLayouts = require("../../lib/generate-layouts");

describe("generate-layouts", function () {
  it("should validate default layout", function () {
    expect(generateLayouts("lib/default-layout-config.js")).to.be.an("array");
  });

  it("should fail on bad layouts", function () {
    expect(function () {
      generateLayouts("fake/layout-not-found");
    }).to.throw(/Cannot find module/);

    expect(function () {
      mock("fake/invalid-config-layout", { invalid: "config" });
      generateLayouts("fake/invalid-config-layout");
    }).to.throw(/instance is not of a type\(s\) array/);
  });

  it("should generate empty layout", function () {
    mock("fake/empty-layout", []);
    expect(generateLayouts("fake/empty-layout")).to.be.empty;
  });

  it("should include a getPosition method", function () {
    var layout = generateLayouts("lib/default-layout-config.js");
    var fake = { fake: "result" };

    expect(layout[0]).to.respondTo("getPosition");
    expect(layout[0].getPosition(fake)).to.eql(fake);
  });
});
