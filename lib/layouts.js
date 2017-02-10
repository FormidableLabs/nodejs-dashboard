"use strict";

/* eslint-disable no-magic-numbers */

var LOG_HEIGHT = 0.5;
var MEMORY_HEIGHT = 15;

var getLogWidth = function (parent) {
  return Math.floor(parent.width * 0.75);
};

// Each layout is an object of <view name>: <view config> pairs
module.exports = [
  {
    stdout: {
      getPosition: function (parent) {
        return {
          height: Math.ceil(parent.height * LOG_HEIGHT),
          width: getLogWidth(parent)
        };
      }
    },
    stderr: {
      getPosition: function (parent) {
        return {
          top: Math.ceil(parent.height * LOG_HEIGHT),
          width: getLogWidth(parent)
        };
      }
    },
    stdouterr: {
      getPosition: function (parent) {
        return {
          width: getLogWidth(parent)
        };
      }
    },
    cpu: {
      getPosition: function (parent) {
        return {
          left: getLogWidth(parent),
          height: Math.floor((parent.height - MEMORY_HEIGHT) / 2)
        };
      },
      limit: 10
    },
    eventLoop: {
      getPosition: function (parent) {
        return {
          top: Math.floor((parent.height - MEMORY_HEIGHT) / 2),
          left: getLogWidth(parent),
          bottom: MEMORY_HEIGHT
        };
      },
      limit: 10
    },
    memory: {
      getPosition: function (parent) {
        return {
          left: getLogWidth(parent),
          height: MEMORY_HEIGHT,
          bottom: 0
        };
      }
    }
  },
  {
    cpu: {
      getPosition: function (parent) {
        return {
          height: Math.ceil(parent.height / 2)
        };
      },
      limit: 30
    },
    eventLoop: {
      getPosition: function (parent) {
        return {
          top: Math.ceil(parent.height / 2)
        };
      },
      limit: 30
    }
  },
  {
    stdout: {
      getPosition: function () {
        return { width: "100%", height: "100%" };
      }
    }
  }
];
