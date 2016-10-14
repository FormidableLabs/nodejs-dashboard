<h1 align="center">nodejs-dashboard</h1>

<h4 align="center">
  Telemetry dashboard for node.js apps from the terminal!
</h4>

***

![http://i.imgur.com/FDEsZEC.png](http://i.imgur.com/FDEsZEC.png)

Determine in realtime what's happening inside your node process from the terminal. No need to instrument code to get the deets. Also splits stderr/stdout to help spot errors sooner.

### Install

`npm install nodejs-dashboard --save-dev`

#### Add the reporting module to your code

From within your `index.js` or app entry point simply require the `nodejs-dashboard` module.

```
require("nodejs-dashboard");
```

#### Update your package.json

It's recommended that you create a npm script to launch the dashboard.

```
...
"scripts": {
    "dev": "nodejs-dashboard node index.js"
  }
...
```

If your app requires additional arguments you'll need to pass the `--` flag to your script. For example:

```
...
"scripts": {
    "dev": "nodejs-dashboard -- node -myFlag=false --bar=true index.js"
  }
...
```

##### But I want to use something else to launch my app!

Most CLI interfaces provide a mechanism for launching other tools. If you're looking to use something like [nodemon](https://github.com/remy/nodemon) or [babel](https://github.com/babel/babel/tree/master/packages/babel-cli) checkout the exec options provided by the cli.

`nodemon --exec "nodejs-dashboard babel-node" src/index.js`


#### Launch your app
Once you've completed these steps run the following in your terminal:

```
% npm run dev
```

#### What options does nodejs-dashboard support?

Usage: nodejs-dashboard [options] -- [node] [script] [arguments]
```
Options:

  -h, --help             output usage information
  -V, --version          output the version number
  -p, --port [port]      Socket listener port
  -e, --eventdelay [ms]  Minimum threshold for event loop reporting, default 10ms
```

#####`-port`
Under the hood the dashboard utilizes SocketIO with a default port of `9838`. If this conflicts with an existing service you can optionally change this value.

#####`-eventdelay`
This tunes the minimum threshold for reporting event loop delays. The default value is `10ms`. Any delay below this value will be reported at `0`.

To gracefully exit and terminate the spawned process use one of:  `Ctrl + C`, `Q`, or `ESC`.
