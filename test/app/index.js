"use strict";

/* eslint-disable no-console, no-magic-numbers */

require("../../index");

const _ = require("lodash");

const slowFunc = function (count) {
  const begin = Date.now();

  // Deliberately unused variable.
  // eslint-disable-next-line no-unused-vars
  let values = _.times(count, () => _.random(0, count));
  values = _.sortBy(values);

  return Date.now() - begin;
};

const main = () => {
  const bigBuffer = Buffer.alloc(200000000);

  let count = 1;
  setInterval(() => {
    console.log("Reporting from a test app, %d.", count);
    count++;
  }, 1000);

  setInterval(() => {
    console.log("Slow call started...");
    const duration = slowFunc(_.random(1000, 100000));
    console.log("Completed in: ", duration);
  }, 3000);

  setInterval(() => {
    console.log("Filling buffer...");
    bigBuffer.fill(2);
  }, 5000);

  setInterval(() => {
    console.error("bummer shoulda read the dox :(", new Error().stack);
  }, 5000);

  let progress = 0;
  setInterval(() => {
    console.log("[STATUS] Status update: ", progress);
  }, 3000);

  setInterval(() => {
    console.error("[STATUS] STATUS ERROR! (", progress, ")");
  }, 7000);

  setInterval(() => {
    console.log("[PROGRESS] ", progress++);
  }, 1000);
};

if (require.main === module) {
  main();
}
