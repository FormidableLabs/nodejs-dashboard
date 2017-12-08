"use strict";

var blessed = require("blessed");

var ERROR_TEXT_DISPLAY_TIME = 3000;

var STYLES = {
  node: {
    position: {
      top: "center",
      left: "center",
      // using fixed numbers to support use of alignment tags
      width: 64,
      height: 12
    },
    border: "line",
    padding: {
      left: 1,
      right: 1
    },
    style: {
      border: {
        fg: "white"
      }
    },
    tags: true,
    hidden: true,
    label: " Goto Time "
  },
  form: {
    name: "form",
    top: 0,
    left: 0,
    height: "100%-2",
    width: "100%-4",
    keys: true
  },
  timeRangeLabel: {
    top: 1,
    align: "center",
    width: "100%",
    content: ""
  },
  textBox: {
    name: "textBox",
    input: true,
    inputOnFocus: true,
    top: 3,
    left: 0,
    height: 1,
    width: "100%",
    style: {
      fg: "white",
      bg: "black",
      focus: {
        fg: "yellow"
      },
      underline: true
    },
    keys: true,
    content: ""
  },
  errorText: {
    top: 5,
    align: "center",
    width: "100%",
    height: 1,
    content: "",
    style: {
      fg: "red"
    },
    hidden: true
  },
  acceptButton: {
    top: "100%-3",
    height: 3,
    width: "half",
    name: "accept",
    content: "Accept",
    align: "center",
    style: {
      focus: {
        bg: "green",
        fg: "black"
      },
      border: {
        fg: "green"
      },
      fg: "green"
    },
    border: {
      type: "line"
    }
  },
  cancelButton: {
    left: "50%",
    top: "100%-3",
    height: 3,
    width: "half",
    name: "cancel",
    content: "Cancel",
    align: "center",
    style: {
      focus: {
        bg: "red",
        fg: "black"
      },
      fg: "red",
      border: {
        fg: "red"
      }
    },
    border: {
      type: "line"
    }
  }
};

/**
 * This is the constructor for the Goto Time View.
 *
 * @param {Object} options
 * Options that may be specified.
 *
 * @returns {void}
 */
/* eslint-disable max-statements */
var GotoTimeView = function GotoTimeView(options) {
  this.metricsProvider = options.metricsProvider;
  this.parent = options.parent;
  this.screen = options.screen;

  this.node = blessed.box(STYLES.node);
  this.form = blessed.form(STYLES.form);
  this.timeRangeLabel = blessed.text(STYLES.timeRangeLabel);
  this.textBox = blessed.textbox(STYLES.textBox);
  this.errorText = blessed.text(STYLES.errorText);
  this.acceptButton = blessed.button(STYLES.acceptButton);
  this.cancelButton = blessed.button(STYLES.cancelButton);
  this.timeRangeLabel.setContent(this.getTimeRangeLabel());

  this.parent.append(this.node);
  this.node.append(this.form);
  this.form.append(this.timeRangeLabel);
  this.form.append(this.textBox);
  this.form.append(this.errorText);
  this.form.append(this.acceptButton);
  this.form.append(this.cancelButton);

  this.screen.on("metrics", this._onMetrics.bind(this));
  this.node.on("show", this._onShow.bind(this));
  this.form.on("submit", this._onSubmit.bind(this));
  this.form.on("cancel", this.hide.bind(this));
  this.form.on("reset", this.errorText.hide.bind(this.errorText));
  this.textBox.key("enter", this.acceptButton.press.bind(this.acceptButton));
  this.textBox.key("escape", this.cancelButton.press.bind(this.cancelButton));
  this.acceptButton.key("escape", this.cancelButton.press.bind(this.cancelButton));
  this.acceptButton.on("press", this.form.submit.bind(this.form));
  this.cancelButton.key("escape", this.cancelButton.press.bind(this.cancelButton));
  this.cancelButton.on("press", this.form.cancel.bind(this.form));
};
/* eslint-enable max-statements */

// dynamically change the range as the underlying data grows
GotoTimeView.prototype._onMetrics = function () {
  this.timeRangeLabel.setContent(this.getTimeRangeLabel());
};

GotoTimeView.prototype._onShow = function () {
  this.screen.saveFocus();
  this.node.setFront();
  this.form.reset();
  this.textBox.focus();
};

GotoTimeView.prototype._onSubmit = function (data) {
  if (this.errorTimeout) {
    clearTimeout(this.errorTimeout);
    delete this.errorTimeout;
  }

  try {
    var timeValue = this.validate(data);
    this.metricsProvider.gotoTimeValue(timeValue);
    this.hide();
  } catch (e) {
    this.errorText.setContent(e.message);
    this.errorText.show();
    this.textBox.focus();
    this.screen.render();

    this.errorTimeout = setTimeout(function () {
      this.errorText.hide();
      this.screen.render();
    }.bind(this), ERROR_TEXT_DISPLAY_TIME);
  }
};

/**
 * Toggle the visibility of the view.
 *
 * @returns {void}
 */
GotoTimeView.prototype.toggle = function () {
  this.node.toggle();
};

/**
 * Hide the view.
 *
 * @returns {void}
 */
GotoTimeView.prototype.hide = function () {
  this.node.hide();
  this.screen.restoreFocus();
  this.screen.render();
};

/**
 * Check to see if the view is visible.
 *
 * @returns {Boolean}
 * Truthy if the view is visible, falsey otherwise.
 */
GotoTimeView.prototype.isVisible = function () {
  return this.node.visible;
};

/**
 * Get the time range for the view.
 *
 * @returns {Object}
 * The time range is returned.
 */
GotoTimeView.prototype.getTimeRange = function () {
  var timeRange = this.metricsProvider.getAvailableTimeRange();

  return {
    min: timeRange.minTime.label,
    max: timeRange.maxTime.label
  };
};

/**
 * Get the time range label for the view.
 *
 * @returns {String}
 * The time range label is returned.
 */
GotoTimeView.prototype.getTimeRangeLabel = function () {
  var timeRange = this.getTimeRange();

  return "Enter a time value between "
    + timeRange.min
    + " and "
    + timeRange.max;
};

/**
 * Validate the view input.
 *
 * @param {Object} data
 * The data entered in the view.
 *
 * @throws {Error}
 * Will throw if there is an error.
 *
 * @returns {Number}
 * The validated view input is returned.
 */
GotoTimeView.prototype.validate = function (data) {
  return this.metricsProvider.validateTimeLabel(data.textBox);
};

module.exports = GotoTimeView;
