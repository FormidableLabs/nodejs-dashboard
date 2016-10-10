/* eslint-disable */
"use strict";

require("../lib/dashboard-agent");

const _ = require("lodash");

const slowFunc = (count) => {
  let values = [];
  const begin = Date.now();
  _.times(count, (i) => {
    values.push(_.random(0,10000));
  });

  values = _.sortBy(values);

  return Date.now() - begin;

}

const bigBuffer = new Buffer.alloc(200000000);

let count = 1;
setInterval(() => {
  console.log(`Reporting from a test app, ${count}.`);
  count++;
}, 1000);

setInterval(() => {
  console.log("Slow call started...");
  const  duration = slowFunc(_.random(1000,100000));
  console.log("Completed in: ", duration);
}, 3000);

setInterval(() => {
  console.log("Filling buffer...");
  bigBuffer.fill(2);
}, 5000);



setInterval(() => {
  console.error("bummer shoulda read the dox :(", new Error().stack);
}, 5000);
