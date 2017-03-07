"use strict";

var _ = require("lodash");

var parseSettings = function (settings) {
  var settingsList = settings.split(",");
  var parseResult = {};

  for (var i = 0; i < settingsList.length; i++) {
    var keyValue = settingsList[i].split("=");
    if (keyValue.length !== 2) { // eslint-disable-line no-magic-numbers
      return {
        error: "error: settings should have format <view_type>.<param>=<value>: " +
          settingsList[i]
      };
    }
    var key = keyValue[0].trim();
    var value = keyValue[1].trim();
    if (!/^[\w\d\[\]_-]+(\.[\w\d\[\]_-]+)+$/.test(key)) {
      return {
        error: "error: invalid path '" + key + "' for setting: " + settingsList[i]
      };
    }

    if (/^\d+(\.\d*)?$/.test(value)) {
      _.set(parseResult, key, parseFloat(value));
    } else if (/^(true|false)$/.test(value)) {
      _.set(parseResult, key, value === "true");
    } else {
      _.set(parseResult, key, value);
    }
  }

  return { result: parseResult };
};

module.exports = parseSettings;
