"use strict";

const blessed = require("blessed");
const expect = require("chai").expect;
const sinon = require("sinon");

const HelpView = require("../../../lib/views/help");
const utils = require("../../utils");

describe("HelpView", () => {
  let sandbox;
  let testContainer;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    utils.stubWidgets(sandbox);
    testContainer = utils.getTestContainer(sandbox);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should create a box with text describing keybindings", () => {
    const help = new HelpView({ parent: testContainer });
    expect(help).to.have.property("node").that.is.an.instanceof(blessed.box);
    expect(help.node).to.have.nested.property("options.content").that.contains("keybindings");
    expect(help.node).to.have.property("hidden", true);
  });
});
