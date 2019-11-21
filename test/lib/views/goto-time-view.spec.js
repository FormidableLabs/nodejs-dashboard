/* eslint-disable max-statements,max-len */

"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");
const blessed = require("blessed");

const GotoTimeView = require("../../../lib/views/goto-time-view");
const utils = require("../../utils");
const MetricsProvider = require("../../../lib/providers/metrics-provider");

describe("GotoTimeView", () => {
  let clock;
  let sandbox;
  let testContainer;
  let options;

  const createTestContainer = function (stubEvents) {
    testContainer = utils.getTestContainer(sandbox, stubEvents);
    options = {
      parent: testContainer,
      screen: testContainer.screen,
      metricsProvider: new MetricsProvider(testContainer.screen)
    };
  };

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    utils.stubWidgets(sandbox);
    createTestContainer(true);
  });

  afterEach(() => {
    sandbox.restore();
    clock.restore();
  });

  describe("constructor", () => {
    it("should create a popup screen", () => {
      const gotoTimeView = new GotoTimeView(options);
      expect(gotoTimeView).to.be.an.instanceof(GotoTimeView);

      expect(gotoTimeView).to.have.property("metricsProvider").which.is.an.instanceOf(MetricsProvider);
      expect(gotoTimeView).to.have.property("screen").which.is.an("object");
      expect(gotoTimeView).to.have.property("parent").which.is.an.instanceOf(blessed.box);

      expect(gotoTimeView).to.have.property("node").which.is.an.instanceOf(blessed.node);
      expect(gotoTimeView).to.have.property("form").which.is.an.instanceOf(blessed.form);
      expect(gotoTimeView).to.have.property("timeRangeLabel").which.is.an.instanceOf(blessed.text);
      expect(gotoTimeView).to.have.property("textBox").which.is.an.instanceOf(blessed.textbox);
      expect(gotoTimeView).to.have.property("errorText").which.is.an.instanceOf(blessed.text);
      expect(gotoTimeView).to.have.property("acceptButton").which.is.an.instanceOf(blessed.button);
      expect(gotoTimeView).to.have.property("cancelButton").which.is.an.instanceOf(blessed.button);
    });
  });

  describe("screen_onMetrics", () => {
    it("updates the time range label", () => {
      // to make the screen act like a real event emitter, set stubEvents to false
      // and create a new testContainer
      createTestContainer(false);

      const gotoTimeView = new GotoTimeView(options);
      const spyGetTimeRangeLabel = sandbox.spy(gotoTimeView, "getTimeRangeLabel");

      gotoTimeView.screen.emit("metrics");

      expect(spyGetTimeRangeLabel).to.have.been.calledOnce;

      expect(gotoTimeView.timeRangeLabel.setContent)
        .to.have.been.calledWithExactly(spyGetTimeRangeLabel.returnValues[0]);
    });
  });

  describe("node_onShow", () => {
    it("saves focus and pops up the dialog", () => {
      const gotoTimeView = new GotoTimeView(options);
      const spyTextBoxFocus = sandbox.spy(gotoTimeView.textBox, "focus");

      gotoTimeView.node.emit("show");

      expect(gotoTimeView.screen.saveFocus).to.have.been.calledOnce;
      expect(gotoTimeView.node.setFront).to.have.been.calledOnce;
      expect(gotoTimeView.form.reset).to.have.been.calledOnce;
      expect(spyTextBoxFocus).to.have.been.calledOnce;
    });
  });

  describe("form_onReset", () => {
    it("hides any error text being shown", () => {
      const gotoTimeView = new GotoTimeView(options);
      gotoTimeView.form.emit("reset");

      expect(gotoTimeView.errorText.hide).to.have.been.calledOnce;
    });
  });

  describe("textBox_onKey_enter", () => {
    it("presses the accept button programmatically", () => {
      // to make the screen act like a real event emitter, set stubEvents to false
      // and create a new testContainer
      createTestContainer(false);

      const gotoTimeView = new GotoTimeView(options);

      gotoTimeView.textBox.focus();
      gotoTimeView.screen.program.emit("keypress", "enter", { full: "enter" });

      expect(gotoTimeView.acceptButton.press).to.have.been.calledOnce;
    });
  });

  describe("textBox_onKey_escape", () => {
    it("presses the cancel button programmatically", () => {
      // to make the screen act like a real event emitter, set stubEvents to false
      // and create a new testContainer
      createTestContainer(false);

      const gotoTimeView = new GotoTimeView(options);

      gotoTimeView.textBox.focus();
      gotoTimeView.screen.program.emit("keypress", "escape", { full: "escape" });

      expect(gotoTimeView.cancelButton.press).to.have.been.calledOnce;
    });
  });

  describe("acceptButton_onKey_escape", () => {
    it("presses the cancel button programmatically", () => {
      // to make the screen act like a real event emitter, set stubEvents to false
      // and create a new testContainer
      createTestContainer(false);

      const gotoTimeView = new GotoTimeView(options);

      gotoTimeView.acceptButton.focus();
      gotoTimeView.screen.program.emit("keypress", "escape", { full: "escape" });

      expect(gotoTimeView.cancelButton.press).to.have.been.calledOnce;
    });
  });

  describe("cancelButton_onKey_escape", () => {
    it("presses itself programmatically", () => {
      // to make the screen act like a real event emitter, set stubEvents to false
      // and create a new testContainer
      createTestContainer(false);

      const gotoTimeView = new GotoTimeView(options);

      gotoTimeView.cancelButton.focus();
      gotoTimeView.screen.program.emit("keypress", "escape", { full: "escape" });

      expect(gotoTimeView.cancelButton.press).to.have.been.calledOnce;
    });
  });

  describe("acceptButton_onPress", () => {
    it("submits the form", () => {
      const gotoTimeView = new GotoTimeView(options);
      gotoTimeView.acceptButton.emit("press");

      expect(gotoTimeView.form.submit).to.have.been.calledOnce;
    });
  });

  describe("cancelButton_onPress", () => {
    it("cancels the form", () => {
      const gotoTimeView = new GotoTimeView(options);
      gotoTimeView.cancelButton.emit("press");

      expect(gotoTimeView.form.cancel).to.have.been.calledOnce;
    });
  });

  describe("form_onSubmit", () => {
    it("validates data received and hides when valid", () => {
      const mockData = {
        textBox: ""
      };
      const mockValidatedData = "";

      const stubValidate
        = sandbox.stub(options.metricsProvider, "validateTimeLabel").returns(mockValidatedData);

      const gotoTimeView = new GotoTimeView(options);
      const spyValidate = sandbox.spy(gotoTimeView, "validate");
      const spyHide = sandbox.spy(gotoTimeView, "hide");

      gotoTimeView.form.emit("submit", mockData);

      expect(stubValidate)
        .to.have.been.calledOnce
        .and.to.have.been.calledWithExactly(mockData.textBox);

      expect(spyValidate)
        .to.have.been.calledOnce
        .and.to.have.been.calledWithExactly(mockData)
        .and.to.have.returned(mockValidatedData);

      expect(spyHide).to.have.been.calledOnce;
    });

    it("validates data received and displays error when invalid", () => {
      const mockData = {
        textBox: ""
      };
      const mockError = new Error("Invalid");

      const stubValidate
        = sandbox.stub(options.metricsProvider, "validateTimeLabel").throws(mockError);

      const gotoTimeView = new GotoTimeView(options);

      const spyClearTimeout = sandbox.spy(clock, "clearTimeout");
      const spyValidate = sandbox.spy(gotoTimeView, "validate");
      const spyTextBoxFocus = sandbox.spy(gotoTimeView.textBox, "focus");

      gotoTimeView.form.emit("submit", mockData);

      expect(stubValidate)
        .to.have.been.calledOnce
        .and.to.have.been.calledWithExactly(mockData.textBox);

      expect(spyValidate)
        .to.have.been.calledOnce
        .and.to.have.been.calledWithExactly(mockData)
        .and.to.have.thrown(mockError);

      expect(gotoTimeView.errorText.setContent)
        .to.have.been.calledWithExactly(mockError.message);

      expect(gotoTimeView.errorText.show).to.have.been.calledOnce;
      expect(spyTextBoxFocus).to.have.been.calledOnce;
      expect(gotoTimeView.screen.render).to.have.been.calledOnce;

      // delay to cause the error text to disappear
      clock.tick(clock.timers[1].delay);

      expect(gotoTimeView.errorText.hide).to.have.been.calledOnce;
      expect(gotoTimeView.screen.render).to.have.been.calledTwice;

      // call it again to cause clearTimeout
      gotoTimeView.form.emit("submit", mockData);

      expect(spyClearTimeout).to.have.been.calledOnce;
    });
  });

  describe("form_onCancel", () => {
    it("hides the popup", () => {
      const gotoTimeView = new GotoTimeView(options);
      const spyHide = sandbox.spy(gotoTimeView, "hide");

      gotoTimeView.form.emit("cancel");

      expect(spyHide).to.have.been.calledOnce;
    });
  });

  describe("toggle", () => {
    it("toggles the visibility of the popup", () => {
      const gotoTimeView = new GotoTimeView(options);
      gotoTimeView.toggle();

      expect(gotoTimeView.node.toggle).to.have.been.calledOnce;
    });
  });

  describe("hide", () => {
    it("hides the popup and restores focus", () => {
      const gotoTimeView = new GotoTimeView(options);

      gotoTimeView.hide();

      expect(gotoTimeView.node.hide).to.have.been.calledOnce;
      expect(gotoTimeView.screen.restoreFocus).to.have.been.calledOnce;
      expect(gotoTimeView.screen.render).to.have.been.calledOnce;
    });
  });

  describe("isVisible", () => {
    it("returns the visibility of the popup", () => {
      const gotoTimeView = new GotoTimeView(options);
      gotoTimeView.toggle();

      expect(gotoTimeView.node.toggle).to.have.been.calledOnce;
      expect(gotoTimeView.isVisible()).to.equal(false);
    });
  });
});
