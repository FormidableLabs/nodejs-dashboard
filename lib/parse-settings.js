"use strict";

const _ = require("lodash");

const parseSettings = function (settings) {
  const settingsList = settings.split(",");
  const parseResult = {};

  for (let i = 0; i < settingsList.length; i++) {
    const keyValue = settingsList[i].split("=");
    if (keyValue.length !== 2) { // eslint-disable-line no-magic-numbers
      return {
        error: `error: settings should have format <view_type>.<param>=<value>: ${
          settingsList[i]}`
      };
    }
    const key = keyValue[0].trim();
    const value = keyValue[1].trim();
    if (!(/^[\w\d\[\]_-]+(\.[\w\d\[\]_-]+)+$/).test(key)) {
      return {
        error: `error: invalid path '${key}' for setting: ${settingsList[i]}`
      };
    }

    if ((/^\d+(\.\d*)?$/).test(value)) {
      _.set(parseResult, key, parseFloat(value));
    } else if ((/^(true|false)$/).test(value)) {
      _.set(parseResult, key, value === "true");
    } else {
      _.set(parseResult, key, value);
    }
  }

  return { result: parseResult };
};

module.exports = parseSettings;
