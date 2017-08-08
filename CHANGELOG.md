# Change log

## [Unreleased] - 2017-08-08
- **Added:** Pause, Rewind and Fast Forward Graphs [\#67]
- **Added:** Longer history for graphs [\#64]

## [v0.4.1] - 2017-03-21
- **Added:** Historical memory usage graph [\#63]
- **Added:** Support for log filtering - see README [\#62]

## [v0.4.0] - 2017-02-18

- **Added:** Support multiple customizable layouts [\#53], [\#59] - see README
- **Removed**: `-i, --interleave` option - now available through layouts
- **Changed**: Line graphs in default layout show 30s instead of 10s of data [\#59]
- **Changed**: Improve views positioning, rerender on screen resize [\#51]
- **Fixed**: Properly disable autoscroll if user has scrolled up [\#56]
- *Internal*: Add description and keywords to package.json [\#49]
- *Internal*: Test coverage [\#52], set up travis [\#54], add tests for views [\#57]

## [v0.3.0] - 2016-12-20

- **Added**: interleave mode for stdout/stderr [\#47]

## [v0.2.1] - 2016-12-01

- **Fixed**: Memory leak bug [\#45]

## [v0.2.0] - 2016-11-03

- **Added**: Support older versions of node (0.10+) by converting to es5 syntax [\#43], [\#44]

## [v0.1.2] - 2016-10-20

- **Changed**: Round cpu percentage to nearest decimal [\#35]
- **Docs**: Add examples to README [\#28], describe global install usage [\#37]
- *Internal*: Better tests [\#34]

## [v0.1.1] - 2016-10-14

- **Changed**: Limit node version in package.json [\#18]
- **Docs**: Update README [\#4], include exit keybindings [\#11]

## v0.1.0 - 2016-10-11
- **Docs**: Update readme styling [\#1]
- *Internal*: Remove dependency on root-require, update repo url in package.json [\#2]
- *Internal*: Test scaffolding and basic reporter integration test [\#3]

[v0.4.1]: https://github.com/FormidableLabs/nodejs-dashboard/compare/v0.4.0...v0.4.1
[v0.4.0]: https://github.com/FormidableLabs/nodejs-dashboard/compare/v0.3.0...v0.4.0
[v0.3.0]: https://github.com/FormidableLabs/nodejs-dashboard/compare/v0.2.1...v0.3.0
[v0.2.1]: https://github.com/FormidableLabs/nodejs-dashboard/compare/v0.2.0...v0.2.1
[v0.2.0]: https://github.com/FormidableLabs/nodejs-dashboard/compare/v0.1.2...v0.2.0
[v0.1.2]: https://github.com/FormidableLabs/nodejs-dashboard/compare/v0.1.1...v0.1.2
[v0.1.1]: https://github.com/FormidableLabs/nodejs-dashboard/compare/v0.1.0...v0.1.1

[\#67]: https://github.com/FormidableLabs/nodejs-dashboard/pull/70
[\#64]: https://github.com/FormidableLabs/nodejs-dashboard/pull/66
[\#63]: https://github.com/FormidableLabs/nodejs-dashboard/pull/63
[\#62]: https://github.com/FormidableLabs/nodejs-dashboard/pull/62
[\#59]: https://github.com/FormidableLabs/nodejs-dashboard/pull/59
[\#57]: https://github.com/FormidableLabs/nodejs-dashboard/pull/57
[\#56]: https://github.com/FormidableLabs/nodejs-dashboard/pull/56
[\#54]: https://github.com/FormidableLabs/nodejs-dashboard/pull/54
[\#53]: https://github.com/FormidableLabs/nodejs-dashboard/pull/53
[\#52]: https://github.com/FormidableLabs/nodejs-dashboard/pull/52
[\#51]: https://github.com/FormidableLabs/nodejs-dashboard/pull/51
[\#50]: https://github.com/FormidableLabs/nodejs-dashboard/pull/50
[\#49]: https://github.com/FormidableLabs/nodejs-dashboard/pull/49
[\#47]: https://github.com/FormidableLabs/nodejs-dashboard/pull/47
[\#45]: https://github.com/FormidableLabs/nodejs-dashboard/pull/45
[\#44]: https://github.com/FormidableLabs/nodejs-dashboard/pull/44
[\#43]: https://github.com/FormidableLabs/nodejs-dashboard/pull/43
[\#37]: https://github.com/FormidableLabs/nodejs-dashboard/pull/37
[\#35]: https://github.com/FormidableLabs/nodejs-dashboard/pull/35
[\#34]: https://github.com/FormidableLabs/nodejs-dashboard/pull/34
[\#28]: https://github.com/FormidableLabs/nodejs-dashboard/pull/28
[\#25]: https://github.com/FormidableLabs/nodejs-dashboard/pull/25
[\#18]: https://github.com/FormidableLabs/nodejs-dashboard/pull/18
[\#11]: https://github.com/FormidableLabs/nodejs-dashboard/pull/11
[\#4]: https://github.com/FormidableLabs/nodejs-dashboard/pull/4
[\#3]: https://github.com/FormidableLabs/nodejs-dashboard/pull/3
[\#2]: https://github.com/FormidableLabs/nodejs-dashboard/pull/2
[\#1]: https://github.com/FormidableLabs/nodejs-dashboard/pull/1
