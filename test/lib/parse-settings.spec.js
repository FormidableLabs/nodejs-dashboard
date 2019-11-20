/* eslint-disable strict, no-magic-numbers */

const expect = require("chai").expect;

const parseSettings = require("../../lib/parse-settings");

describe("parse-settings", () => {
  it("should fail on invalid settings", () => {
    expect(parseSettings("fail").error).to.contain("settings should have format");
  });

  it("should have valid setting path", () => {
    expect(parseSettings("test()=fail").error).to.contain("invalid path");
    expect(parseSettings("=fail").error).to.contain("invalid path");
  });

  it("should parse valid settings", () => {
    expect(parseSettings("view1.scrollback=100, view1.enabled = true, view2.title=test").result)
      .to.deep.equal({
        view1: {
          scrollback: 100,
          enabled: true
        },
        view2: {
          title: "test"
        }
      });
  });
});
