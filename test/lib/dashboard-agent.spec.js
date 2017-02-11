"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var SocketIO = require("socket.io");
var config = require("../../lib/config");
var dashboardAgent = require("../../lib/dashboard-agent");
var pusage = require("pidusage");
var tryCatch = require("../utils").tryCatch;

describe("dashboard-agent", function () {

  var sandbox;
  var server;
  var agent;
  var TEST_PORT = 12345;

  before(function () {
    sandbox = sinon.sandbox.create();
    process.env[config.PORT_KEY] = TEST_PORT;
    process.env[config.BLOCKED_THRESHOLD_KEY] = 1;
    process.env[config.REFRESH_INTERVAL_KEY] = 10;
  });

  beforeEach(function () {
    agent = dashboardAgent();
    server = new SocketIO(TEST_PORT);
  });

  afterEach(function (done) {
    agent.destroy();
    sandbox.restore();
    server.close(done);
  });

  describe("initialization", function () {

    it("should use environment variables for configuration", function (done) {
      var checkMetrics = function (metrics) {
        expect(metrics).to.be.an("object");
        expect(metrics.eventLoop.delay).to.be.a("number");
      };

      server.on("connection", function (socket) {
        try {
          expect(socket).to.be.an("object");
          socket.on("error", done);
        } catch (err) {
          done(err);
        }
        socket.on("metrics", function (data) {
          tryCatch(done, function () {
            socket.removeAllListeners("metrics");
            checkMetrics(JSON.parse(data));
          });
        });
      });
    });
  });

  describe("reporting", function () {
    it("should provide basic metrics", function (done) {

      var checkMetrics = function (metrics) {
        expect(metrics).to.be.an("object");
        expect(metrics.eventLoop).to.deep.equal({ delay: 0, high: 0 });
        expect(metrics.mem.systemTotal).to.be.above(0);
        expect(metrics.mem.rss).to.be.above(0);
        expect(metrics.mem.heapTotal).to.be.above(0);
        expect(metrics.mem.heapUsed).to.be.above(0);
        expect(metrics.cpu.utilization).to.be.above(0);
      };

      agent._getStats(function (err, metrics) {
        tryCatch(done, function () {
          expect(err).to.be.null;
          checkMetrics(metrics);
        });
      });
    });

    it("should report an event loop delay and cpu stats", function (done) {
      var delay = { current: 100, max: 150 };
      var pusageResults = { cpu: 50 };
      sandbox.stub(pusage, "stat").yields(null, pusageResults);

      agent._delayed(delay.max);
      agent._delayed(delay.current);

      var checkMetrics = function (metrics) {
        expect(metrics.eventLoop.delay).to.equal(delay.current);
        expect(metrics.eventLoop.high).to.equal(delay.max);
        expect(metrics.cpu.utilization).to.equal(pusageResults.cpu);
      };

      agent._getStats(function (err, metrics) {
        tryCatch(done, function () {
          expect(err).to.be.null;
          checkMetrics(metrics);
        });
      });
    });

    it("should return an error when pusage fails", function (done) {
      sandbox.stub(pusage, "stat").yields(new Error("bad error"));

      agent._getStats(function (err, metrics) {
        tryCatch(done, function () {
          expect(err).to.exist;
          expect(metrics).to.be.undefined;
          expect(err.message).to.equal("bad error");
        });
      });
    });
  });
});
