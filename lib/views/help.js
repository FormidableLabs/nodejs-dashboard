"use strict";

var blessed = require("blessed");

var pkg = require("../../package.json");

var HelpView = function HelpView(options) {
  var content = [
    "{center}{bold}keybindings{/bold}{/center}",
    "",
    "{cyan-fg} left, right{/}  rotate through layouts",
    "{cyan-fg}        w, s{/}  increase / decrease graph units of time",
    "{cyan-fg}        a, d{/}  scroll left / right graphs",
    "{cyan-fg}        z, x{/}  go to begin / end graphs",
    "{cyan-fg}           g{/}  go to user-defined time graph index...",
    "{cyan-fg}         esc{/}  close popup window / return to default layout",
    "{cyan-fg}        h, ?{/}  toggle this window",
    "{cyan-fg}   ctrl-c, q{/}  quit",
    "",
    "{right}{white-fg}version: " + pkg.version + "{/}"
  ].join("\n");

  this.node = blessed.box({
    position: {
      top: "center",
      left: "center",
      // using fixed numbers to support use of alignment tags
      width: 64,
      height: 14
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
    content: content,
    hidden: true
  });

  this.node.on("show", function () {
    options.parent.screen.saveFocus();
    this.node.setFront();
  }.bind(this));

  this.node.on("hide", function () {
    options.parent.screen.restoreFocus();
  });

  options.parent.append(this.node);
};

/**
 * Toggle the visibility of the view.
 *
 * @returns {void}
 */
HelpView.prototype.toggle = function () {
  this.node.toggle();
};

/**
 * Hide the view.
 *
 * @returns {void}
 */
HelpView.prototype.hide = function () {
  this.node.hide();
};

/**
 * Check to see if the view is visible.
 *
 * @returns {Boolean}
 * Truthy if the view is visible, falsey otherwise.
 */
HelpView.prototype.isVisible = function () {
  return this.node.visible;
};


module.exports = HelpView;
