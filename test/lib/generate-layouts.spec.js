/* eslint-disable strict, no-magic-numbers */

const expect = require("chai").expect;

// Strict mode leads to odd bug in Node < 0.12
const mockRequire = require("mock-require");

// to ensure cross-platform consistency with mixed Posix & Win32 paths, use path.resolve()
const resolve = require("path").resolve;

const mock = function (path, obj) {
  return mockRequire(resolve(path), obj);
};

const generateLayouts = require("../../lib/generate-layouts");

describe("generate-layouts", () => {
  it("should validate default layout", () => {
    expect(generateLayouts("lib/default-layout-config.js")).to.be.an("array");
  });

  it("should fail on bad layouts", () => {
    expect(() => {
      generateLayouts("fake/layout-not-found");
    }).to.throw(/Cannot find module/);

    expect(() => {
      mock("fake/invalid-config-layout", { invalid: "config" });
      generateLayouts("fake/invalid-config-layout");
    }).to.throw(/instance is not of a type\(s\) array/);
  });

  it("should generate empty layout", () => {
    mock("fake/empty-layout", []);
    expect(generateLayouts("fake/empty-layout")).to.be.empty;
  });

  it("should include a getPosition method", () => {
    const layout = generateLayouts("lib/default-layout-config.js");
    const fake = { fake: "result" };

    expect(layout[0]).to.respondTo("getPosition");
    expect(layout[0].getPosition(fake)).to.eql(fake);
  });
});
