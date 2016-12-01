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

var appName = appPkg.name || "node";
var program = new commander.Command(pkg.name);

program.version(pkg.version);
program.option("-p, --port [port]", "Socket listener port");
program.option("-r, --refreshinterval [ms]", "Metrics refresh interval, default 1000ms");
program.option("-e, --eventdelay [ms]", "Minimum threshold for event loop reporting, default 10ms");
program.option("-s, --scrollback [count]", "Maximum scroll history for log windows");
program.usage("[options] -- [node] [script] [arguments]");
program.parse(process.argv);

if (!program.args.length) {
  program.outputHelp();
  return;
}

var command = program.args[0];
var args = program.args.slice(1);

var port = program.port || config.PORT;
var refreshInterval = program.refreshinterval || config.REFRESH_INTERVAL;
var eventDelay = program.eventdelay || config.BLOCKED_THRESHOLD;
var scrollback = program.scrollback || config.SCROLLBACK;

process.env[config.PORT_KEY] = port;
process.env[config.REFRESH_INTERVAL_KEY] = refreshInterval;
process.env[config.BLOCKED_THRESHOLD_KEY] = eventDelay;

var child = spawn(command, args, {
  env: process.env,
  stdio: [null, null, null, null],
  detached: true
});

console.log("Waiting for client connection on %d...", port); //eslint-disable-line

var server = new SocketIO(port);

var dashboard = new Dashboard({ appName: appName, program: program, scrollback: scrollback });

server.on("connection", function (socket) {
  socket.on("metrics", function (data) {
    dashboard.onEvent({ type: "metrics", data: JSON.parse(data) });
  });

  socket.on("error", function (err) {
    console.error("Received error from agent, exiting: ", err); //eslint-disable-line
    process.exit(1); //eslint-disable-line
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
