/* eslint-disable max-statements,max-len */

"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");
var blessed = require("blessed");

var GotoTimeView = require("../../../lib/views/goto-time-view");
var utils = require("../../utils");
var MetricsProvider = require("../../../lib/providers/metrics-provider");

describe("GotoTimeView", function () {
  var clock;
  var sandbox;
  var testContainer;
  var options;

  var createTestContainer = function (stubEvents) {
    testContainer = utils.getTestContainer(sandbox, stubEvents);
    options = {
      parent: testContainer,
      screen: testContainer.screen,
      metricsProvider: new MetricsProvider(testContainer.screen)
    };
  };

  before(function () {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function () {
    clock = sinon.useFakeTimers();
    utils.stubWidgets(sandbox);
    createTestContainer(true);
  });

  afterEach(function () {
    sandbox.restore();
    clock.restore();
  });

  describe("constructor", function () {
    it("should create a popup screen", function () {
      var gotoTimeView = new GotoTimeView(options);
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

  describe("screen_onMetrics", function () {
    it("updates the time range label", function () {
      // to make the screen act like a real event emitter, set stubEvents to false
      // and create a new testContainer
      createTestContainer(false);

      var gotoTimeView = new GotoTimeView(options);
      var spyGetTimeRangeLabel = sandbox.spy(gotoTimeView, "getTimeRangeLabel");

      gotoTimeView.screen.emit("metrics");

      expect(spyGetTimeRangeLabel).to.have.been.calledOnce;

      expect(gotoTimeView.timeRangeLabel.setContent)
        .to.have.been.calledWithExactly(spyGetTimeRangeLabel.returnValues[0]);
    });
  });

  describe("node_onShow", function () {
    it("saves focus and pops up the dialog", function () {
      var gotoTimeView = new GotoTimeView(options);
      var spyTextBoxFocus = sandbox.spy(gotoTimeView.textBox, "focus");

      gotoTimeView.node.emit("show");

      expect(gotoTimeView.screen.saveFocus).to.have.been.calledOnce;
      expect(gotoTimeView.node.setFront).to.have.been.calledOnce;
      expect(gotoTimeView.form.reset).to.have.been.calledOnce;
      expect(spyTextBoxFocus).to.have.been.calledOnce;
    });
  });

  describe("form_onReset", function () {
    it("hides any error text being shown", function () {
      var gotoTimeView = new GotoTimeView(options);
      gotoTimeView.form.emit("reset");

      expect(gotoTimeView.errorText.hide).to.have.been.calledOnce;
    });
  });

  describe("textBox_onKey_enter", function () {
    it("presses the accept button programmatically", function () {
      // to make the screen act like a real event emitter, set stubEvents to false
      // and create a new testContainer
      createTestContainer(false);

      var gotoTimeView = new GotoTimeView(options);

      gotoTimeView.textBox.focus();
      gotoTimeView.screen.program.emit("keypress", "enter", { full: "enter" });

      expect(gotoTimeView.acceptButton.press).to.have.been.calledOnce;
    });
  });

  describe("textBox_onKey_escape", function () {
    it("presses the cancel button programmatically", function () {
      // to make the screen act like a real event emitter, set stubEvents to false
      // and create a new testContainer
      createTestContainer(false);

      var gotoTimeView = new GotoTimeView(options);

      gotoTimeView.textBox.focus();
      gotoTimeView.screen.program.emit("keypress", "escape", { full: "escape" });

      expect(gotoTimeView.cancelButton.press).to.have.been.calledOnce;
    });
  });

  describe("acceptButton_onKey_escape", function () {
    it("presses the cancel button programmatically", function () {
      // to make the screen act like a real event emitter, set stubEvents to false
      // and create a new testContainer
      createTestContainer(false);

      var gotoTimeView = new GotoTimeView(options);

      gotoTimeView.acceptButton.focus();
      gotoTimeView.screen.program.emit("keypress", "escape", { full: "escape" });

      expect(gotoTimeView.cancelButton.press).to.have.been.calledOnce;
    });
  });

  describe("cancelButton_onKey_escape", function () {
    it("presses itself programmatically", function () {
      // to make the screen act like a real event emitter, set stubEvents to false
      // and create a new testContainer
      createTestContainer(false);

      var gotoTimeView = new GotoTimeView(options);

      gotoTimeView.cancelButton.focus();
      gotoTimeView.screen.program.emit("keypress", "escape", { full: "escape" });

      expect(gotoTimeView.cancelButton.press).to.have.been.calledOnce;
    });
  });

  describe("acceptButton_onPress", function () {
    it("submits the form", function () {
      var gotoTimeView = new GotoTimeView(options);
      gotoTimeView.acceptButton.emit("press");

      expect(gotoTimeView.form.submit).to.have.been.calledOnce;
    });
  });

  describe("cancelButton_onPress", function () {
    it("cancels the form", function () {
      var gotoTimeView = new GotoTimeView(options);
      gotoTimeView.cancelButton.emit("press");

      expect(gotoTimeView.form.cancel).to.have.been.calledOnce;
    });
  });

  describe("form_onSubmit", function () {
    it("validates data received and hides when valid", function () {
      var mockData = {
        textBox: ""
      };
      var mockValidatedData = "";

      var stubValidate =
        sandbox.stub(options.metricsProvider, "validateTimeLabel").returns(mockValidatedData);

      var gotoTimeView = new GotoTimeView(options);
      var spyValidate = sandbox.spy(gotoTimeView, "validate");
      var spyHide = sandbox.spy(gotoTimeView, "hide");

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

    it("validates data received and displays error when invalid", function () {
      var mockData = {
        textBox: ""
      };
      var mockError = new Error("Invalid");

      var stubValidate =
        sandbox.stub(options.metricsProvider, "validateTimeLabel").throws(mockError);

      var gotoTimeView = new GotoTimeView(options);

      var spyClearTimeout = sandbox.spy(clock, "clearTimeout");
      var spyValidate = sandbox.spy(gotoTimeView, "validate");
      var spyTextBoxFocus = sandbox.spy(gotoTimeView.textBox, "focus");

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

  describe("form_onCancel", function () {
    it("hides the popup", function () {
      var gotoTimeView = new GotoTimeView(options);
      var spyHide = sandbox.spy(gotoTimeView, "hide");

      gotoTimeView.form.emit("cancel");

      expect(spyHide).to.have.been.calledOnce;
    });
  });

  describe("toggle", function () {
    it("toggles the visibility of the popup", function () {
      var gotoTimeView = new GotoTimeView(options);
      gotoTimeView.toggle();

      expect(gotoTimeView.node.toggle).to.have.been.calledOnce;
    });
  });

  describe("hide", function () {
    it("hides the popup and restores focus", function () {
      var gotoTimeView = new GotoTimeView(options);

      gotoTimeView.hide();

      expect(gotoTimeView.node.hide).to.have.been.calledOnce;
      expect(gotoTimeView.screen.restoreFocus).to.have.been.calledOnce;
      expect(gotoTimeView.screen.render).to.have.been.calledOnce;
    });
  });

  describe("isVisible", function () {
    it("returns the visibility of the popup", function () {
      var gotoTimeView = new GotoTimeView(options);
      gotoTimeView.toggle();

      expect(gotoTimeView.node.toggle).to.have.been.calledOnce;
      expect(gotoTimeView.isVisible()).to.equal.false;
    });
  });
});
