"use strict";

const _ = require("lodash");
const constants = require("./constants");

const TIME_SCALES = constants.TIME_SCALES;
const TIME_LABEL_PATTERN = constants.TIME_LABEL_PATTERN;

/**
 * Compute a condensed human-readable label for a given time value.
 *
 * @param {Number} timeValue
 * The logical index of time.
 *
 * @returns {String}
 * A scaled, string-representation of time at the index is returned.
 */
exports.getLabel
= function getLabel(timeValue) {
    const DIGITS_PER_UNIT = 2;
    const timeElements = [];

    if (timeValue === 0) {
      return ":00";
    }

    _.every(TIME_SCALES, (timeScale, index, timeScales) => {
      const timeElement = {
        units: timeScale.units,
        value: 0
      };

      // stop reducing when it cannot be divided
      if (timeValue < timeScale.divisor) {
        return false;
      }

      // don't capture a time element for milliseconds
      if (timeScale.units !== "ms") {
      // reduce by the divisor
        timeElement.value = timeValue / timeScale.divisor;

        // if there are more elements after, take the modulo to get the remainder
        if (index < timeScales.length - 1) {
          timeElement.value = Math.floor(timeElement.value % timeScales[index + 1].divisor);
        } else {
          timeElement.value = Math.floor(timeElement.value);
        }

        timeElements.push(timeElement);
      }

      // reduce
      timeValue /= timeScale.divisor;

      return true;
    });

    return _.reduce(timeElements, (prev, curr, index) => {
      switch (curr.units) {
      case "s":
        return `:${_.padStart(curr.value, DIGITS_PER_UNIT, "0")}`;
      case "m":
      case "h":
        if (index < timeElements.length - 1) {
          return (curr.units === "m" ? ":" : " ")
          + _.padStart(curr.value, DIGITS_PER_UNIT, "0")
          + prev;
        }
        return curr.value + prev;

      default:
        return curr.value + curr.units + prev;
      }
    }, "");
  };

/**
 * Given a time label value (ex: 2y 5d 1:22:33), produce the actual
 * time value in ms.
 *
 * @param {String} label
 * The time label to convert.
 *
 * @throws {Error}
 * An error is thrown if the time label cannot be converted to ms.
 *
 * @returns {Number}
 * The time value in ms is returned.
 */
exports.convertTimeLabelToMilliseconds = function (label) {
  /* eslint-disable no-magic-numbers */

  // a container for all time elements
  const timeElements = {
    y: 0,
    d: 0,
    t: [],
    h: 0,
    m: 0,
    s: 0
  };

  // the initial divisor
  let divisor = TIME_SCALES[0].divisor;

  // break up the input
  const split = TIME_LABEL_PATTERN.exec(label);

  // take the broken apart pieces and consume them
  _.each(_.slice(split, 1), (value, index) => {
    // skip undefined values
    if (value === undefined) {
      return;
    }

    // get the numeric and unit components, if any
    const pieces = (/^:?(\d*)([yd])?/).exec(value);

    switch (index) {
    case 0:
    case 1:
      // year and day are just keys
      timeElements[pieces[2]] = Number(pieces[1]);
      break;
    case 2:
    case 3:
    case 4:
      // time is only slightly trickier; missing elements get pushed down
      timeElements.t.push(Number(pieces[1]));
      break;
    }
  });

  while (timeElements.t.length < 3) {
    // complete the time picture with leading zeros
    timeElements.t.unshift(0);
  }

  // convert time parts to keys
  timeElements.h = timeElements.t[0];
  timeElements.m = timeElements.t[1];
  timeElements.s = timeElements.t[2];

  // now we can discard the time array
  delete timeElements.t;

  // now, reduce the time elements by the scaling factors
  return _.reduce(TIME_SCALES, (prev, timeScale, index) => {
    // the divisor grows with each time scale factor
    divisor *= timeScale.divisor;

    // if the time element is represented, multiply by current divisor
    if (timeElements[timeScale.units]) {
      // if there are more time scales to go, make sure the current value
      // does not exceed its limits (ex: 90s should be 1:30 instead)
      if (index < TIME_SCALES.length - 1) {
        if (timeElements[timeScale.units] >= TIME_SCALES[index + 1].divisor) {
          throw new Error("Enter a valid time value");
        }
      }

      // continue to accumulate the time
      prev += timeElements[timeScale.units] * divisor;
    }

    return prev;
  }, 0);

  /* eslint-enable no-magic-numbers */
};
