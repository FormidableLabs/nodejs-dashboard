"use strict";

var expect = require("chai").expect;
var mock = require("mock-fs");

var generateLayouts = require("../../lib/generate-layouts");

var parent = {
  width: 17,
  height: 13
};

describe("generate-layouts", function () {
  beforeEach(function () {
    mock({
      fake: {
        "empty-layout": "[]",
        "broken-json-layout": "broken json",
        "fill-view-layout": JSON.stringify([[
          {
            views: [
              {
                name: "fill"
              }
            ]
          }
        ]]),
        "exact-width-panel-layout": JSON.stringify([[
          {
            position: {
              size: 11
            },
            views: [
              {
                name: "exact-width"
              }
            ]
          }
        ]]),
        "grow-panels-layout": JSON.stringify([[
          {
            position: {
              grow: 2
            },
            views: [
              {
                name: "left"
              }
            ]
          },
          {
            position: {
              grow: 3
            },
            views: [
              {
                name: "right"
              }
            ]
          }
        ]]),
        "mixed-panels-layout": JSON.stringify([[
          {
            position: {
              grow: 2
            },
            views: [
              {
                name: "left"
              }
            ]
          },
          {
            position: {
              size: 4
            },
            views: [
              {
                name: "center"
              }
            ]
          },
          {
            position: {
              grow: 3
            },
            views: [
              {
                name: "right"
              }
            ]
          }
        ]]),
        "exact-height-view-layout": JSON.stringify([[
          {
            views: [
              {
                position: {
                  size: 11
                },
                name: "exact-height"
              }
            ]
          }
        ]]),
        "grow-views-layout": JSON.stringify([[
          {
            views: [
              {
                position: {
                  grow: 2
                },
                name: "top"
              },
              {
                position: {
                  grow: 3
                },
                name: "bottom"
              }
            ]
          }
        ]]),
        "mixed-views-layout": JSON.stringify([[
          {
            views: [
              {
                position: {
                  grow: 2
                },
                name: "top"
              },
              {
                position: {
                  size: 4
                },
                name: "center"
              },
              {
                position: {
                  grow: 3
                },
                name: "bottom"
              }
            ]
          }
        ]])
      }
    });
  });

  afterEach(mock.restore);

  it("should fail on bad layouts", function () {
    expect(function () {
      generateLayouts("fake/layout-not-found");
    }).to.throw(/no such file or directory/);

    expect(function () {
      generateLayouts("fake/broken-json-layout");
    }).to.throw(/Unexpected token/);
  });

  it("should generate empty layout", function () {
    expect(generateLayouts("fake/empty-layout")).to.be.empty;
  });

  it("should create fullscreen view", function () {
    var layouts = generateLayouts("fake/fill-view-layout");
    expect(layouts[0]).to.have.deep.property("fill.getPosition").that.is.a("function");
    expect(layouts[0].fill.getPosition(parent)).to.be.deep.equal({
      left: 0,
      top: 0,
      width: parent.width,
      height: parent.height
    });
  });

  it("should create exact width panel", function () {
    var layouts = generateLayouts("fake/exact-width-panel-layout");
    expect(layouts[0]["exact-width"].getPosition(parent)).to.be.deep.equal({
      left: 0,
      top: 0,
      width: 11,
      height: parent.height
    });
  });

  it("should create growing panels", function () {
    var layouts = generateLayouts("fake/grow-panels-layout");
    expect(layouts[0].left.getPosition(parent)).to.be.deep.equal({
      left: 0,
      top: 0,
      width: 7,
      height: parent.height
    });
    expect(layouts[0].right.getPosition(parent)).to.be.deep.equal({
      left: 7,
      top: 0,
      width: 10,
      height: parent.height
    });
  });

  it("should create mixed width panels", function () {
    var layouts = generateLayouts("fake/mixed-panels-layout");
    expect(layouts[0].left.getPosition(parent)).to.be.deep.equal({
      left: 0,
      top: 0,
      width: 6,
      height: parent.height
    });
    expect(layouts[0].center.getPosition(parent)).to.be.deep.equal({
      left: 6,
      top: 0,
      width: 4,
      height: parent.height
    });
    expect(layouts[0].right.getPosition(parent)).to.be.deep.equal({
      left: 10,
      top: 0,
      width: 7,
      height: parent.height
    });
  });

  it("should create exact height view", function () {
    var layouts = generateLayouts("fake/exact-height-view-layout");
    expect(layouts[0]["exact-height"].getPosition(parent)).to.be.deep.equal({
      left: 0,
      top: 0,
      width: parent.width,
      height: 11
    });
  });

  it("should create growing views", function () {
    var layouts = generateLayouts("fake/grow-views-layout");
    expect(layouts[0].top.getPosition(parent)).to.be.deep.equal({
      left: 0,
      top: 0,
      width: parent.width,
      height: 6
    });
    expect(layouts[0].bottom.getPosition(parent)).to.be.deep.equal({
      left: 0,
      top: 6,
      width: parent.width,
      height: 7
    });
  });

  it("should create mixed height views", function () {
    var layouts = generateLayouts("fake/mixed-views-layout");
    expect(layouts[0].top.getPosition(parent)).to.be.deep.equal({
      left: 0,
      top: 0,
      width: parent.width,
      height: 4
    });
    expect(layouts[0].center.getPosition(parent)).to.be.deep.equal({
      left: 0,
      top: 4,
      width: parent.width,
      height: 4
    });
    expect(layouts[0].bottom.getPosition(parent)).to.be.deep.equal({
      left: 0,
      top: 8,
      width: parent.width,
      height: 5
    });
  });
});
