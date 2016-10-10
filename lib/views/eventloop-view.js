"use strict";

const contrib = require("blessed-contrib");
const _ = require("lodash");

class EventLoopView {

  constructor(options) {

    this.historyDepth = 10;
    this.eventLoopHistory = _.times(this.historyDepth, _.constant(0));

    this.line = contrib.line({
      label: " event loop delay ",
      border: {
        type: "line"
      },
      style: {
        line: "yellow",
        text: "green",
        baseline: "black",
        border: {
          fg: "cyan"
        }
      },
      top: "33%",
      left: "75%",
      height: "33%",
      width: "25%",
      numYLabels: 4,
      showLegend: false,
      wholeNumbersOnly: true
    });

    this.highwaterStats = {
      title: "highwater",
      x: _.reverse(_.times(this.historyDepth, String)),
      y: this.eventLoopHistory,
      style: {
        line: "red"
      }
    };

    this.eventLoopStats = {
      title: "delay",
      x: _.reverse(_.times(this.historyDepth, String)),
      y: this.eventLoopHistory,
      style: {
        line: "yellow"
      }
    };

    options.parent.append(this.line);
    this.line.setData([this.eventLoopStats, this.highwaterStats]);
  }

  onEvent(data) {
    const eventLoop = data.eventLoop;
    this.highwaterStats.y = _.times(this.historyDepth, _.constant(eventLoop.high));
    this.line.setLabel(` event loop delay (${eventLoop.delay}ms), high (${eventLoop.high}ms) `);
    this.eventLoopHistory.push(eventLoop.delay);

    if (this.eventLoopHistory.length > this.historyDepth) {
      this.eventLoopHistory.shift();
    }

    this.line.setData([this.eventLoopStats, this.highwaterStats]);
  }
}

module.exports = EventLoopView;
