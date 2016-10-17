"use strict";

const blessed = require("blessed");

class StreamView {

  constructor(options) {

    this.scrollBox = blessed.log({
      top: options.top || "0%",
      label: ` ${options.label} `,
      scrollable: true,
      input: true,
      alwaysScroll: true,
      scrollbar: {
        ch: " ",
        inverse: true
      },
      keys: true,
      mouse: false,
      left: "top",
      width: "75%",
      height: "50%",
      tags: true,
      border: {
        type: "line"
      },
      style: {
        fg: "white",
        bg: "black",
        border: {
          fg: options.color || "#f0f0f0"
        }
      }
    });

    options.parent.append(this.scrollBox);
  }

  onEvent(data) {
    this.scrollBox.log(data);
  }
}

module.exports = StreamView;
