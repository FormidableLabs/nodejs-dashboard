"use strict";

// Each layout is an object of <view name>: <view config> pairs
module.exports = [
  {
    stdout: {
      position: { height: "50%", width: "75%" }
    },
    stderr: {
      position: { top: "50%", width: "75%" }
    },
    stdouterr: {
      position: { width: "75%" },
    },
    cpu: {
      position: { top: 0, left: "75%", height: "33%", width: "25%" },
      limit: 10
    },
    eventLoop: {
      position: { top: "33%", left: "75%", height: "33%", width: "25%" },
      limit: 10
    },
    memory: {
      position: { top: "66%", left: "75%", height: "33%", width: "25%" }
    }
  },
  {
    cpu: {
      position: { top: 0, height: "50%", width: "100%" },
      limit: 30
    },
    eventLoop: {
      position: { top: "50%", height: "50%", width: "100%" },
      limit: 30
    }
  },
  {
    stdout: {
      position: { width: "100%", height: "100%" }
    }
  }
];
