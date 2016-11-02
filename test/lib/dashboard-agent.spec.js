"use strict";

var expect = require("chai").expect;
var sinon = require("sinon");

var SocketIO = require("socket.io");
var config = require("../../lib/config");
var dashboardAgent = require("../../lib/dashboard-agent");
var pusage = require("pidusage");

describe("dashboard-agent", () => {

  let server;
  let agent;
  var TEST_PORT = 12345;
  var REPORTING_THRESHOLD = 1500;

  before(() => {
    process.env[config.PORT_KEY] = TEST_PORT;
    process.env[config.BLOCKED_THRESHOLD_KEY] = 1;
  });

  beforeEach(() => {
    agent = dashboardAgent();
    server = new SocketIO(TEST_PORT);
  });

  afterEach(() => {
    server.close();
    agent.destroy();
  });

  describe("initialization", () => {
    let clock;
    before(() => {
      clock = sinon.useFakeTimers();
    });

    after(() => {
      clock.restore();
    });

    it("should use environment variables for configuration", (done) => {
      var checkMetrics = (metrics) => {
        expect(metrics).to.be.exist;
        expect(metrics.eventLoop.delay).to.equal(0);
      };

      clock.tick(REPORTING_THRESHOLD);

      server.on("connection", (socket) => {
        expect(socket).to.be.defined;
        socket.on("error", done);
        socket.on("metrics", (data) => { //eslint-disable-line max-nested-callbacks
          checkMetrics(JSON.parse(data));
          done();
        });
      });
    });
  });

  describe("reporting", () => {
    it("should provide basic metrics", (done) => {

      var checkMetrics = (metrics) => {
        expect(metrics).to.be.defined;
        expect(metrics.eventLoop).to.deep.equal({ delay: 0, high: 0 });
        expect(metrics.mem).to.exist;
        expect(metrics.mem.systemTotal).to.be.above(0);
        expect(metrics.mem.rss).to.be.above(0);
        expect(metrics.mem.heapTotal).to.be.above(0);
        expect(metrics.mem.heapUsed).to.be.above(0);
        expect(metrics.cpu.utilization).to.be.above(0);
      };

      agent._getStats((err, metrics) => {
        expect(err).to.be.null;
        checkMetrics(metrics);
        done();
      });
    });

    it("should report an event loop delay and cpu stats", (done) => {
      var delay = { current: 100, max: 150 };
      var pusageResults = { cpu: 50 };
      var pidStub = sinon.stub(pusage, "stat").yields(null, pusageResults);

      agent._delayed(delay.max);
      agent._delayed(delay.current);

      var checkMetrics = (metrics) => {
        expect(metrics.eventLoop.delay).to.equal(delay.current);
        expect(metrics.eventLoop.high).to.be.equal(delay.max);
        expect(metrics.cpu.utilization).to.equal(pusageResults.cpu);
      };

      agent._getStats((err, metrics) => {
        expect(err).to.be.null;
        checkMetrics(metrics);
        pidStub.restore();
        done();
      });
    });

    it("should return an error when pusage fails", (done) => {
      var pidStub = sinon.stub(pusage, "stat").yields(new Error("bad error"));

      agent._getStats((err, metrics) => {
        expect(err).to.exist;
        expect(metrics).to.be.undefined;
        expect(err.message).to.equal("bad error");
        pidStub.restore();
        done();
      });
    });
  });
});
