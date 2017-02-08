"use strict";

exports.tryCatch = function (done, func) {
  try {
    func();
    done();
  } catch (err) {
    done(err);
  }
};
