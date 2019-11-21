"use strict";

const _ = require("lodash");
const assert = require("assert");
const path = require("path");
const defaultLayoutConfig = require("./default-layout-config");
const validate = require("jsonschema").validate;
const layoutConfigSchema = require("./layout-config-schema.json");

module.exports = function generateLayouts(layoutsFile) {
  let layoutConfig = defaultLayoutConfig;
  if (layoutsFile) {
    /* eslint-disable global-require */
    try {
      layoutConfig = require(layoutsFile);
    } catch (err1) {
      layoutConfig = require(path.resolve(process.cwd(), layoutsFile));
    }
    /* eslint-enable global-require */
    const validationResult = validate(layoutConfig, layoutConfigSchema);
    assert(
      validationResult.valid,
      `Layout config is invalid:\n\n  * ${validationResult.errors.join("\n  * ")}\n`
    );
  }

  return layoutConfig.map((layouts) => ({
    view: {
      type: "panel",
      views: layouts.map((config) => _.merge(config, { type: "panel" }))
    },
    getPosition: _.identity
  }));
};
