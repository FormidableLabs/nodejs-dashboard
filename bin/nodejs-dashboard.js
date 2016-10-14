#!/usr/bin/env node
"use strict";

const SocketIO = require("socket.io");
const spawn = require("cross-spawn");
const commander = require("commander");
const path = require("path");

const Dashboard = require("../lib/dashboard");
const config = require("../lib/config");
const appPkg = require(path.resolve("package.json"));
const pkg = require("../package.json");

const appName = appPkg.name || "node";
const program = new commander.Command(pkg.name);

program.version(pkg.version);
program.option("-p, --port [port]", "Socket listener port");
program.option("-e, --eventdelay [ms]", "Minimum threshold for event loop reporting, default 10ms");
program.usage("[options] -- [node] [script] [arguments]");
program.parse(process.argv);

if (!program.args.length) {
  program.outputHelp();
  return;
}

const command = program.args[0];
const args = program.args.slice(1);

const port = program.port || config.PORT;
const eventDelay = program.eventdelay || config.BLOCKED_THRESHOLD;

process.env[config.PORT_KEY] = port;
process.env[config.BLOCKED_THRESHOLD_KEY] = eventDelay;

const child = spawn(command, args, {
  env: process.env,
  stdio: [null, null, null, null],
  detached: true
});

console.log(`Waiting for client connection on ${port}...`); //eslint-disable-line

const server = new SocketIO(port);

const dashboard = new Dashboard({ appName, program });

server.on("connection", (socket) => {
  socket.on("metrics", (data) => {
    dashboard.onEvent({ type: "metrics", data: JSON.parse(data) });
  });

  socket.on("error", (err) => {
    console.error("Received error from agent, exiting: ", err); //eslint-disable-line
    process.exit(1); //eslint-disable-line
  });
});

child.stdout.on("data", (data) => {
  dashboard.onEvent({ type: "stdout", data: data.toString("utf8") });
});

child.stderr.on("data", (data) => {
  dashboard.onEvent({ type: "stderr", data: data.toString("utf8") });
});

process.on("exit", () => {
  process.kill(process.platform === "win32" ? child.pid : -child.pid);
});

require('../index');
