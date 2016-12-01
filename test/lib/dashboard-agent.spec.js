"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var SocketIO = require("socket.io");
var config = require("../../lib/config");
var dashboardAgent = require("../../lib/dashboard-agent");
var pusage = require("pidusage");

describe("dashboard-agent", function () {

  var server;
  var agent;
  var TEST_PORT = 12345;
  var MAX_EVENT_LOOP_DELAY = 10;

  before(function () {
    process.env[config.PORT_KEY] = TEST_PORT;
    process.env[config.BLOCKED_THRESHOLD_KEY] = 1;
    process.env[config.REFRESH_INTERVAL_KEY] = 10;
  });

  beforeEach(function () {
    agent = dashboardAgent();
    server = new SocketIO(TEST_PORT);
  });

  afterEach(function () {
    server.close();
    agent.destroy();
  });

  describe("initialization", function () {

    it("should use environment variables for configuration", function (done) {
      var checkMetrics = function (metrics) {
        expect(metrics).to.be.exist;
        expect(metrics.eventLoop.delay).to.be.at.most(MAX_EVENT_LOOP_DELAY);
      };

      server.on("connection", function (socket) {
        expect(socket).to.be.defined;
        socket.on("error", done);
        socket.on("metrics", function (data) { //eslint-disable-line max-nested-callbacks
          socket.removeAllListeners("metrics");
          checkMetrics(JSON.parse(data));
          done();
        });
      });
    });
  });

  describe("reporting", function () {
    it("should provide basic metrics", function (done) {

      var checkMetrics = function (metrics) {
        expect(metrics).to.be.defined;
        expect(metrics.eventLoop).to.deep.equal({ delay: 0, high: 0 });
        expect(metrics.mem).to.exist;
        expect(metrics.mem.systemTotal).to.be.above(0);
        expect(metrics.mem.rss).to.be.above(0);
        expect(metrics.mem.heapTotal).to.be.above(0);
        expect(metrics.mem.heapUsed).to.be.above(0);
        expect(metrics.cpu.utilization).to.be.above(0);
      };

      agent._getStats(function (err, metrics) {
        expect(err).to.be.null;
        checkMetrics(metrics);
        done();
      });
    });

    it("should report an event loop delay and cpu stats", function (done) {
      var delay = { current: 100, max: 150 };
      var pusageResults = { cpu: 50 };
      var pidStub = sinon.stub(pusage, "stat").yields(null, pusageResults);

      agent._delayed(delay.max);
      agent._delayed(delay.current);

      var checkMetrics = function (metrics) {
        expect(metrics.eventLoop.delay).to.equal(delay.current);
        expect(metrics.eventLoop.high).to.be.equal(delay.max);
        expect(metrics.cpu.utilization).to.equal(pusageResults.cpu);
      };

      agent._getStats(function (err, metrics) {
        expect(err).to.be.null;
        checkMetrics(metrics);
        pidStub.restore();
        done();
      });
    });

    it("should return an error when pusage fails", function (done) {
      var pidStub = sinon.stub(pusage, "stat").yields(new Error("bad error"));

      agent._getStats(function (err, metrics) {
        expect(err).to.exist;
        expect(metrics).to.be.undefined;
        expect(err.message).to.equal("bad error");
        pidStub.restore();
        done();
      });
    });
  });
});
