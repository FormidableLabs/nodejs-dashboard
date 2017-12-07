"use strict";

var blessed = require("blessed");

var ERROR_TEXT_DISPLAY_TIME = 3000;

/**
 * This is the constructor for the Goto Time View.
 *
 * @param {Object} options
 * Options that may be specified.
 *
 * @returns {void}
 */
var GotoTimeView = function GotoTimeView(options) {
  /**
   * Create the elements that make up the view.
   *
   * @returns {void}
   */
  var createViewElements = function () {
    this.node = blessed.box({
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
    });

    this.form = blessed.form({
      name: "form",
      top: 0,
      left: 0,
      height: "100%-2",
      width: "100%-4",
      keys: true
    });

    this.timeRangeLabel = blessed.text({
      top: 1,
      align: "center",
      width: "100%",
      content: this.getTimeRangeLabel()
    });

    this.textBox = blessed.textbox({
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
    });

    this.errorText = blessed.text({
      top: 5,
      align: "center",
      width: "100%",
      height: 1,
      content: "",
      style: {
        fg: "red"
      },
      hidden: true
    });

    this.acceptButton = blessed.button({
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
    });

    this.cancelButton = blessed.button({
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
    });
  }.bind(this);

  /**
   * Construct the view now that the elements have been created.
   *
   * @returns {void}
   */
  var constructView = function () {
    options.parent.append(this.node);

    this.node.append(this.form);
    this.form.append(this.timeRangeLabel);
    this.form.append(this.textBox);
    this.form.append(this.errorText);
    this.form.append(this.acceptButton);
    this.form.append(this.cancelButton);
  }.bind(this);

  /**
   * Setup all event handlers for the screen to flow.
   *
   * @returns {void}
   */
  var setupEventHandlers = function () {
    this.screen.on("metrics", function () {
      // dynamically change the range as the underlying data grows
      this.timeRangeLabel.setContent(this.getTimeRangeLabel());
    }.bind(this));

    this.node.on("show", function () {
      this.screen.saveFocus();
      this.node.setFront();
      this.form.reset();
      this.textBox.focus();
    }.bind(this));

    this.form.on("reset", function () {
      this.errorText.hide();
    }.bind(this));

    this.textBox.key("enter", function () {
      this.acceptButton.press();
    }.bind(this));

    this.textBox.key("escape", function () {
      this.cancelButton.press();
    }.bind(this));

    this.acceptButton.key("escape", function () {
      this.cancelButton.press();
    }.bind(this));

    this.acceptButton.on("press", function () {
      this.form.submit();
    }.bind(this));

    this.cancelButton.key("escape", function () {
      this.cancelButton.press();
    }.bind(this));

    this.cancelButton.on("press", function () {
      this.form.cancel();
    }.bind(this));

    this.form.on("submit", function (data) {
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
    }.bind(this));

    this.form.on("cancel", function () {
      this.hide();
    }.bind(this));
  }.bind(this);

  // capture options
  this.metricsProvider = options.metricsProvider;
  this.parent = options.parent;
  this.screen = options.screen;

  // build the view
  createViewElements();
  constructView();
  setupEventHandlers();
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
