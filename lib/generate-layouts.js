"use strict";

var _ = require("lodash");
var assert = require("assert");
var path = require("path");
var defaultLayoutConfig = require("./default-layout-config");
var validate = require("jsonschema").validate;
var layoutConfigSchema = require("./layout-config-schema.json");

module.exports = function generateLayouts(layoutsFile) {
  var layoutConfig = defaultLayoutConfig;
  if (layoutsFile) {
    /* eslint-disable global-require */
    try {
      layoutConfig = require(layoutsFile);
    } catch (err1) {
      layoutConfig = require(path.resolve(process.cwd(), layoutsFile));
    }
    /* eslint-enable global-require */
    var validationResult = validate(layoutConfig, layoutConfigSchema);
    assert(
      validationResult.valid,
      "Layout config is invalid:\n\n  * " + validationResult.errors.join("\n  * ") + "\n"
    );
  }

  return layoutConfig.map(function (layouts) {
    return {
      view: {
        type: "panel",
        views: layouts.map(function (config) { return _.merge(config, { type: "panel" }); })
      },
      getPosition: _.identity
    };
  });
};
