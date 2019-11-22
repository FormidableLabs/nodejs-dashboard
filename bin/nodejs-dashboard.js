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
const parseSettings = require("../lib/parse-settings");

const appName = appPkg.name || "node";
const program = new commander.Command(pkg.name);

// Mimic commander syntax errors (with offsets) for consistency
/* eslint-disable no-console */
const exitWithError = function () {
  const args = Array.prototype.slice.call(arguments);
  console.error();
  console.error(...[" "].concat(args));
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
  (settings) => {
    const res = parseSettings(settings);

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

const command = program.args[0];
const args = program.args.slice(1);

const port = program.port;

process.env[config.PORT_KEY] = port;
process.env[config.REFRESH_INTERVAL_KEY] = program.refreshinterval;
process.env[config.BLOCKED_THRESHOLD_KEY] = program.eventdelay;

// Enhance `NODE_PATH` to include the dashboard such that `require("nodejs-dashboard")`
// works even if globally installed.
// See: https://github.com/FormidableLabs/nodejs-dashboard/issues/90
const IS_WIN = process.platform.indexOf("win") === 0;
const DELIM = IS_WIN ? ";" : ":";
const DASHBOARD_PATH = path.resolve(__dirname, "../..");
const NODE_PATH = (process.env.NODE_PATH || "")
  .split(DELIM)
  .filter(Boolean)
  .concat(DASHBOARD_PATH)
  .join(DELIM);

const child = spawn(command, args, {
  env: {
    ...process.env,
    NODE_PATH
  },
  stdio: [null, null, null, null],
  detached: true
});

console.log("Waiting for client connection on %d...", port); //eslint-disable-line

const server = new SocketIO(port);

const dashboard = new Dashboard({
  appName,
  program,
  layoutsFile: program.layouts,
  settings: program.settings
});

server.on("connection", (socket) => {
  socket.on("metrics", (data) => {
    dashboard.onEvent({ type: "metrics",
      data: JSON.parse(data) });
  });

  socket.on("error", (err) => {
    exitWithError("Received error from agent, exiting: ", err);
  });
});

child.stdout.on("data", (data) => {
  dashboard.onEvent({ type: "stdout",
    data: data.toString("utf8") });
});

child.stderr.on("data", (data) => {
  dashboard.onEvent({ type: "stderr",
    data: data.toString("utf8") });
});

process.on("exit", () => {
  process.kill(process.platform === "win32" ? child.pid : -child.pid);
});
