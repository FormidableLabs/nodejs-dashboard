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
  -l, --layouts [file]        Path to file or npm module with layouts
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

### Customizing layouts

See [`lib/default-layout-config.js`](./lib/default-layout-config.js) and [`test/app/layouts.js`](./test/app/layouts.js) for examples.

A layouts config file should export an array of layouts:
- Each layout is an array of panels
- A panel is an object representing a vertical section of the screen (i.e. a column). Its properties are:
  - `position`: optional, see below
  - `views`: array of views
- A view is an object identifying one of the existing `___View` classes to be displayed. Its properties are:
  - `type`: one of `log`, `cpu`, `memory`, `eventloop`
  - `title`: optional view title (default value depends on view type)
  - `borderColor`: view border color
  - `position`: optional, see below
  - type-specific settings, see below
  - `module`: defines module with factory function for custom view, see below

##### position
`position` defines the item's height (for views) or width (for panels). It can have one of:
- `size`: fixed value (rows/cols)
- `grow`: proportional to the container

`position` is optional - it defaults to `{ grow: 1 }` if not specified

For example, if a panel has 3 views with these positions:
- A: size 15
- B: grow 1
- C: grow 3

A will have a height of 15. B and C will split the remaining area proportionally (B gets 25%, C gets 75%).

##### `log` view properties
  - `streams`: array of streams that view will listen to. Acceptable values are `stdout` and `stderr`
  - `fgColor`: text color
  - `bgColor`: background color
  - `scrollback`: specifies the maximum number of lines that log will buffer in order to scroll backwards and see the history. The default is 1000 lines
  - `exclude`: optional pattern - matching lines will be excluded from log
  - `include`: optional pattern - matching lines will be included in log. If pattern has a capturing group, only a content matching that group will be logged.

##### `cpu` / `eventLoop` view properties
  - `limit`: line graph views accept this option indicating how many data points to display

### Custom views

To define your own view, use `module` property. Module should export function,
that receives `BaseView` and returns custom view, inherited from `BaseView`. Your view constructor will be called with `options`, that have some useful properties:
- `logProvider` - use `logProvider.getLog(streams)` to get log history for `stdout` / `stderr` streams, or subscribe to stream events with `logProvider.on(stream, callback)`
- `metricsProvider` - in the same way, use `metricsProvider.getMetrics(limit)` or `metricsProvider.on("metrics", callback)`

`BaseView` will also provide some properties and methods:
- `this.parent` - parent node. View should define `this.node` and attach it to `this.parent`
- `this.layoutConfig` - config from layout, with pre-filled default values
- `this.recalculatePosition()` - call it to apply position after defining `this.node`

View can override these methods:
- `BaseView.prototype.getDefaultLayoutConfig()` - returns default layout parameters for your view
- `BaseView.prototype.destroy()` - use it to unsubscribe from events, destroy data etc.

#### Custom view example

```js
var blessed = require("blessed");

module.exports = function (BaseView) {
  var HelloWorldView = function HelloWorldView(options) {
    BaseView.call(this, options);

    this.node = blessed.box({
      label: " " + this.layoutConfig.title + " ",
      content: "Hello {bold}world{/bold}!",
      border: "line",
      style: {
        border: {
          fg: this.layoutConfig.borderColor
        }
      }
    });

    this.recalculatePosition();

    this.parent.append(this.node);
  };

  HelloWorldView.prototype = Object.create(BaseView.prototype);

  HelloWorldView.prototype.getDefaultLayoutConfig = function () {
    return {
      title: "hello world view"
    };
  };

  return HelloWorldView;
};
```

##### nodejs-dashboard-progress-layout

Another example is [nodejs-dashboard-progress-layout](https://github.com/alexkuz/nodejs-dashboard-layout-progress), that [uses log view](https://github.com/alexkuz/nodejs-dashboard-layout-progress/blob/master/status-layout.js#L23) to display status and [defines custom ProgressView](https://github.com/alexkuz/nodejs-dashboard-layout-progress/blob/master/progress-view.js) to track progress updates:

![image](https://cloud.githubusercontent.com/assets/790659/23140845/e4bb1d52-f7c4-11e6-80b8-e456d9cd5628.png)
