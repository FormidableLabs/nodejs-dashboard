#!/usr/bin/env node
"use strict";

var SocketIO = require("socket.io");
var spawn = require("cross-spawn");
var commander = require("commander");
var path = require("path");

var Dashboard = require("../lib/dashboard");
var config = require("../lib/config");
var appPkg = require(path.resolve("package.json"));
var pkg = require("../package.json");
var parseSettings = require("../lib/parse-settings");

var appName = appPkg.name || "node";
var program = new commander.Command(pkg.name);

// Mimic commander syntax errors (with offsets) for consistency
/* eslint-disable no-console */
var exitWithError = function () {
  var args = Array.prototype.slice.call(arguments);
  console.error();
  console.error.apply(console, [" "].concat(args));
  console.error();
  process.exit(1); // eslint-disable-line no-process-exit
};
/* eslint-enable no-console */

program.option("-e, --eventdelay [ms]",
  "Minimum threshold for event loop reporting, default 10ms",
  config.BLOCKED_THRESHOLD);

program.option("-l, --layouts [file]",
  "Path to file with layouts",
  config.LAYOUTS);

program.option("-p, --port [port]",
  "Socket listener port",
  config.PORT);

program.option("-r, --refreshinterval [ms]",
  "Metrics refresh interval, default 1000ms",
  config.REFRESH_INTERVAL);

program.option("-s, --settings [settings]",
  "Overrides layout settings for given view types",
  function (settings) {
    var res = parseSettings(settings);

    if (res.error) {
      exitWithError(res.error);
    }

    return res.result;
  },
  {}
);

program.version(pkg.version);
program.usage("[options] -- [node] [script] [arguments]");
program.parse(process.argv);

if (!program.args.length) {
  program.outputHelp();
  return;
}

var command = program.args[0];
var args = program.args.slice(1);

var port = program.port;

process.env[config.PORT_KEY] = port;
process.env[config.REFRESH_INTERVAL_KEY] = program.refreshinterval;
process.env[config.BLOCKED_THRESHOLD_KEY] = program.eventdelay;


var child = spawn(command, args, {
  env: process.env,
  stdio: [null, null, null, null],
  detached: true
});

console.log("Waiting for client connection on %d...", port); //eslint-disable-line

var server = new SocketIO(port);

var dashboard = new Dashboard({
  appName: appName,
  program: program,
  layoutsFile: program.layouts,
  settings: program.settings
});

server.on("connection", function (socket) {
  socket.on("metrics", function (data) {
    dashboard.onEvent({ type: "metrics", data: JSON.parse(data) });
  });

  socket.on("error", function (err) {
    exitWithError("Received error from agent, exiting: ", err);
  });
});

child.stdout.on("data", function (data) {
  dashboard.onEvent({ type: "stdout", data: data.toString("utf8") });
});

child.stderr.on("data", function (data) {
  dashboard.onEvent({ type: "stderr", data: data.toString("utf8") });
});

process.on("exit", function () {
  process.kill(process.platform === "win32" ? child.pid : -child.pid);
});
