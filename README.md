<h1 align="center">nodejs-dashboard</h1>

<h4 align="center">
  Telemetry dashboard for node.js apps from the terminal!
</h4>

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

#### CLI options

Usage: `nodejs-dashboard [options] -- [node] [script] [arguments]`

```
Options:
  -h, --help                  output usage information
  -e, --eventdelay [ms]       Minimum threshold for event loop reporting, default 10ms
  -l, --layouts [file]        Path to file with layouts
  -p, --port [port]           Socket listener port
  -r, --refreshinterval [ms]  Metrics refresh interval, default 1000ms
  -V, --version               output the version number
```

##### `--eventdelay`
This tunes the minimum threshold for reporting event loop delays. The default value is `10ms`. Any delay below this value will be reported at `0`.

##### `--layouts`
Optionally supply a custom layout configuration (for details, see [below](#customizing-layouts)). Default: [`lib/default-layout-config.js`](./lib/default-layout-config.js)

##### `--port`
Under the hood the dashboard utilizes SocketIO with a default port of `9838`. If this conflicts with an existing service you can optionally change this value.

##### `--refreshinterval`
Specifies the interval in milliseconds that the metrics should be refreshed. The default is 1000 ms (1 second).

##### `--scrollback`
Specifies the maximum number of lines that log windows (e.g. stdout, stderr) will buffer in order to scroll backwards and see the history. The default is 1000 lines.

### Customizing layouts

See [`lib/default-layout-config.js`](./lib/default-layout-config.js) and [`test/app/layouts.js`](./test/app/layouts.js) for examples.

A layouts config file should export an array of layouts:
- Each layout is an array of panels
- A panel is a object representing a vertical section of the screen (i.e. a column). Its properties are:
  - `position`: optional, see below
  - `views`: array of views
- A view is an object identifying one of the existing `___View` classes to be displayed. Its properties are:
  - `name`: one of `stdout`, `stderr`, `stdouterr`, `cpu`, `memory`, `eventloop`
  - `position`: optional, see below
  - `limit`: line graph views accept this option indicating how many data points to display

`position` defines the item's height (for views) or width (for panels). It can have one of:
- `size`: fixed value (rows/cols)
- `grow`: proportional to the container

`position` is optional - it defaults to `{ grow: 1 }` if not specified

For example, if a panel has 3 views with these positions:
- A: size 15
- B: grow 1
- C: grow 3

A will have a height of 15. B and C will split the remaining area proportionally (B gets 25%, C gets 75%).
