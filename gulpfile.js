"use strict";

var gulp = require("gulp");
var mocha = require("gulp-mocha");

gulp.task("test-debug", function () {
  gulp.src(["test/**/*.spec.js"])
    .pipe(mocha());
});
