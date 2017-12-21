<h1 align="center">nodejs-dashboard</h1>

<h4 align="center">
  Telemetry dashboard for node.js apps from the terminal!
</h4>

[![Build Status](https://travis-ci.org/FormidableLabs/nodejs-dashboard.svg?branch=master)](https://travis-ci.org/FormidableLabs/nodejs-dashboard)

![http://g.recordit.co/WlUvKhXqnp.gif](http://g.recordit.co/WlUvKhXqnp.gif)

Determine in realtime what's happening inside your node process from the terminal. No need to instrument code to get the deets. Also splits stderr/stdout to help spot errors sooner.

[Install](#install) | [Setup](#setup) | [Usage](#usage) | [Using with other programs](#launching-your-app-with-something-other-than-node) | [CLI options](#cli-options) | [Customizing layouts](#customizing-layouts)
---------------|---------------------|-----------------|-----------------|------------------------------------------|----------------------

NOTE: This module isn't designed for production use and should be limited to development environments.

### Install

The preferred method is global install.  `npm install -g nodejs-dashboard`

Local install works also; just use `./node_modules/.bin/nodejs-dashboard` instead of `nodejs-dashboard` to execute.

### Setup

The dashboard agent needs to be required by your app. There are two ways to do this:

#### Including via code

From within a `dev.index.js` script or other dev entry point simply require the `nodejs-dashboard` module.

```js
// dev.index.js
require("nodejs-dashboard");
require("./index");
```

To launch: `nodejs-dashboard node dev.index.js`

#### Including via preload argument

This method utilizes Node's `-r` flag to introduce the `nodejs-dashboard` module. In this setup no code modifications are required. This is functionally equivalent to the above example.

To launch: `nodejs-dashboard -- node -r nodejs-dashboard index.js`

#### Fonts

`nodejs-dashboard` uses the [Braille Unicode character set](https://en.wikipedia.org/wiki/Braille_Patterns#Chart) to show graphs via the [node-drawille](https://github.com/madbence/node-drawille) dependancy. Ensure your terminal program\'s font supports this character set.

#### Environment variables

`nodejs-dashboard` uses several environment variables to modify its behavior. These include some required values to prevent mangled output.

Variable | Required | Source | Description |
--- | --- | --- | --- |
TERM | required | [blessed](https://github.com/chjj/blessed) | Terminal value matching terminal program |
LANG | required | [blessed](https://github.com/chjj/blessed) | Matches encoding of terminal program to display font correctly |
FORCE_COLOR | optional | [chalk](https://github.com/chalk/chalk) | Used to force color output by the subprocess |

### Usage

Press `?` to see a list of keybindings. Use arrow keys to change the layout.

You may want to add an npm script to to your `package.json` to launch your app using nodejs-dashboard using one of the options above. Example:

```js
"scripts": {
  "dev": "nodejs-dashboard -- node -r nodejs-dashboard index.js"
}
```

#### Passing arguments

If your app requires additional arguments you'll need to use the `--` flag to separate them from `nodejs-dashboard` options. For example:

`nodejs-dashboard --port=8002 -- node -m=false --bar=true index.js`

#### Launching your app with something other than `node`

Most CLI interfaces provide a mechanism for launching other tools. If you're looking to use something like [nodemon](https://github.com/remy/nodemon) or [babel](https://github.com/babel/babel/tree/master/packages/babel-cli) checkout the exec options provided by the CLI.

```bash
% nodemon --exec "nodejs-dashboard babel-node" src/index.js
```

#### Docker and Docker Compose support

`nodejs-dashboard` can run inside a container if that container has a [TTY](https://en.wikipedia.org/wiki/Pseudoterminal) allocated to it. The [Docker documentation](https://docs.docker.com/engine/reference/run/#foreground) shows how to run a container with an interactive terminal session. Additional the [Docker Compose documentation](https://docs.docker.com/compose/reference/run/) indicates that `docker-compose run` defaults to allocating a TTY and `docker-compose up` defaults to not allocating one.

#### CLI options

Usage: `nodejs-dashboard [options] -- [node] [script] [arguments]`

```
Options:
  -h, --help                  output usage information
  -e, --eventdelay [ms]       Minimum threshold for event loop reporting, default 10ms
  -l, --layouts [file]        Path to file or npm module with layouts
  -p, --port [port]           Socket listener port
  -r, --refreshinterval [ms]  Metrics refresh interval, default 1000ms
  -s, --settings [settings]   Overrides layout settings for given view types           
  -V, --version               output the version number
```

##### `--eventdelay`
This tunes the minimum threshold for reporting event loop delays. The default value is `10ms`. Any delay below this value will be reported at `0`.

##### `--layouts`
Optionally supply a custom layout configuration (for details, see [Customizing Layouts](/LAYOUTS.md)). Default: [`lib/default-layout-config.js`](./lib/default-layout-config.js)

##### `--port`
Under the hood the dashboard utilizes SocketIO with a default port of `9838`. If this conflicts with an existing service you can optionally change this value.

##### `--refreshinterval`
Specifies the interval in milliseconds that the metrics should be refreshed. The default is 1000 ms (1 second).

##### `--settings`
Overrides default or layout settings for views. Option value `settings` should have a format `<view_type.setting.path>=<value>,...`. For example `--settings log.scrollback=100` will override `scrollback` setting for any view of `log` type (nested paths can be used if needed). For details about layouts, see [Customizing Layouts](/LAYOUTS.md)).