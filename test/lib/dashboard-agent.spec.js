"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");

const SocketIO = require("socket.io");
const config = require("../../lib/config");
const dashboardAgent = require("../../lib/dashboard-agent");
const pusage = require("pidusage");

describe("dashboard-agent", () => {

  let server;
  let agent;
  const TEST_PORT = 12345;
  const REPORTING_THRESHOLD = 1500;

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
      const checkMetrics = (metrics) => {
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

      const checkMetrics = (metrics) => {
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
      const delay = { current: 100, max: 150 };
      const pusageResults = { cpu: 50 };
      const pidStub = sinon.stub(pusage, "stat").yields(null, pusageResults);

      agent._delayed(delay.max);
      agent._delayed(delay.current);

      const checkMetrics = (metrics) => {
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

    it("should return an error when pusage fails", () => {
      const pidStub = sinon.stub(pusage, "stat").yields(new Error("bad error"));

      agent._getStats((err, metrics) => {
        expect(err).to.exist;
        expect(metrics).to.be.undefined;
        expect(err.message).to.equal("bad error");
        pidStub.restore();
      });
    });
  });
});
