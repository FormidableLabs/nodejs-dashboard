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
    "{cyan-fg}         esc{/}  close popup window / return to default layout",
    "{cyan-fg}        h, ?{/}  toggle this window",
    "{cyan-fg}   ctrl-c, q{/}  quit",
    "",
    "{right}{gray-fg}version: " + pkg.version + "{/}"
  ].join("\n");

  this.node = blessed.box({
    position: {
      top: "center",
      left: "center",
      // using fixed numbers to support use of alignment tags
      width: 64,
      height: 13
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

  options.parent.append(this.node);
};

module.exports = HelpView;
