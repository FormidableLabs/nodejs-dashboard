# Customizing layouts

See [`lib/default-layout-config.js`](./lib/default-layout-config.js) and [`test/app/layouts.js`](./test/app/layouts.js) for examples.

A layouts config file should export an array of layouts:
- Each layout is an array of panels
- A panel is an object representing a vertical section of the screen (i.e. a column). Its properties are:
  - `position`: optional, see below
  - `views`: array of views
- A view is an object identifying one of the existing `___View` classes to be displayed. Its properties are:
  - `type`: one of `log`, `cpu`, `memory`, `memoryGraph`, `eventloop`
  - `title`: optional view title (default value depends on view type)
  - `borderColor`: view border color
  - `position`: optional, see below
  - type-specific settings, see below
  - `module`: defines module with factory function for custom view, see below

#### position

`position` defines the item's height (for views) or width (for panels). It can have one of:
- `size`: fixed value (rows/cols)
- `grow`: proportional to the container

`position` is optional - it defaults to `{ grow: 1 }` if not specified

For example, if a panel has 3 views with these positions:
- A: size 15
- B: grow 1
- C: grow 3

A will have a height of 15. B and C will split the remaining area proportionally (B gets 25%, C gets 75%).

#### `log` view properties

  - `streams`: array of streams that view will listen to. Acceptable values are `stdout` and `stderr`
  - `fgColor`: text color
  - `bgColor`: background color
  - `scrollback`: specifies the maximum number of lines that log will buffer in order to scroll backwards and see the history. The default is 1000 lines
  - `exclude`: optional pattern - matching lines will be excluded from log
  - `include`: optional pattern - matching lines will be included in log. If pattern has a capturing group, only a content matching that group will be logged.

#### `cpu` / `eventLoop` view properties
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

#### nodejs-dashboard-progress-layout

Another example is [nodejs-dashboard-progress-layout](https://github.com/alexkuz/nodejs-dashboard-layout-progress), that [uses log view](https://github.com/alexkuz/nodejs-dashboard-layout-progress/blob/master/status-layout.js#L23) to display status and [defines custom ProgressView](https://github.com/alexkuz/nodejs-dashboard-layout-progress/blob/master/progress-view.js) to track progress updates:

![image](https://cloud.githubusercontent.com/assets/790659/23140845/e4bb1d52-f7c4-11e6-80b8-e456d9cd5628.png)
