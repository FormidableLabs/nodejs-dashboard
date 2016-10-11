"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");

const SocketIO = require("socket.io");
const config = require("../../lib/config");
const dashboardAgent = require("../../lib/dashboard-agent");
const _ = require("lodash");

describe("dashboard-agent", () => {

  let server;
  let clock;
  let agent;
  const TEST_PORT = 12345;
  const REPORTING_THRESHOLD = 2000;

  before(() => {
    clock = sinon.useFakeTimers();
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

      clock.tick(REPORTING_THRESHOLD);
      server.on("connection", (socket) => {
        socket.on("error", done);
        socket.on("metrics", (data) => {
          checkMetrics(JSON.parse(data));
          done();
        });
      });
    });

    it("should report an event loop delay", (done) => {
      clock.restore();
      agent.destroy();
      agent = dashboardAgent();

      const slowFunc = () => {
        const count = 10000;
        let values = _.times(count, () => _.random(0, count));

        values = _.sortBy(values);
      };

      const checkMetrics = (metrics) => {
        expect(metrics.eventLoop.delay).to.be.above(0);
        expect(metrics.eventLoop.high).to.be.above(0);
      };

      slowFunc();
      server.on("connection", (socket) => {
        socket.on("error", (err) => done(err));
        socket.on("metrics", (data) => {
          checkMetrics(JSON.parse(data));
          done();
        });
      });
    });
  });
});
