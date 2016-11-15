<h1 align="center">nodejs-dashboard</h1>

<h4 align="center">
  Telemetry dashboard for node.js apps from the terminal!
</h4>

***

![http://i.imgur.com/FDEsZEC.png](http://i.imgur.com/FDEsZEC.png)

Determine in realtime what's happening inside your node process from the terminal. No need to instrument code to get the deets. Also splits stderr/stdout to help spot errors sooner.

## Getting Started

### Install
The preferred method is global install but can optionally be placed locally as well.

```bash
% npm install -g nodejs-dashboard
```


### Add the reporting module

There are a couple patterns for including `nodejs-dashboard` in your code. This module isn't designed for production use and should be limited to development environments.

#### Including via code

From within a `dev.index.js` script or other dev entry point simply require the `nodejs-dashboard` module.

```js
// dev.index.js
require("nodejs-dashboard");
require("./index");
```

Next update your `package.json` to launch the dashboard:

```js
...
"scripts": {
    "dev": "nodejs-dashboard node dev.index.js"
}
...
```

#### Including via preload argument

This method utilizes Node's `-r` flag to introduce the `nodejs-dashboard` module. In this setup no code modifications are required. This is functionally equivalent to the above example.

Update your `package.json` with the new script:

```js
...
"scripts": {
    "dev": "nodejs-dashboard -- node -r nodejs-dashboard index.js"
}
...
```

#### Caveats

If your app requires additional arguments you'll need to pass the `--` flag to your script. For example:

```js
...
"scripts": {
    "dev": "nodejs-dashboard -- node -m=false --bar=true index.js"
}
...
```

#### But I want to use something else to launch my app!

Most CLI interfaces provide a mechanism for launching other tools. If you're looking to use something like [nodemon](https://github.com/remy/nodemon) or [babel](https://github.com/babel/babel/tree/master/packages/babel-cli) checkout the exec options provided by the CLI.

```bash
% nodemon --exec "nodejs-dashboard babel-node" src/index.js
```


### Launch your app
Once you've completed these steps run the following in your terminal:

```bash
% npm run dev
```

### What options does nodejs-dashboard support?

Usage: nodejs-dashboard [options] -- [node] [script] [arguments]
```
Options:

  -h, --help                 output usage information
  -V, --version              output the version number
  -p, --port [port]          Socket listener port
  -r, --refreshinterval [ms] Metrics refresh interval, default 1000ms
  -e, --eventdelay [ms]      Minimum threshold for event loop reporting, default 10ms
  -s, --scrollback [count]   Maximum scroll history for log windows
```

#####`--port`
Under the hood the dashboard utilizes SocketIO with a default port of `9838`. If this conflicts with an existing service you can optionally change this value.

#####`--refreshinterval`
Specifies the interval in milliseconds that the metrics should be refreshed. The default is 1000 ms (1 second).

#####`--eventdelay`
This tunes the minimum threshold for reporting event loop delays. The default value is `10ms`. Any delay below this value will be reported at `0`.

#####`--scrollback`
Specifies the maximum number of lines that log windows (e.g. stdout, stderr) will buffer in order to scroll backwards and see the history. The default is 1000 lines.

To gracefully exit and terminate the spawned process use one of:  `Ctrl + C`, `Q`, or `ESC`.
