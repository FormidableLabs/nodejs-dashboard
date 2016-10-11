"use strict";

const expect = require("chai").expect;

const SocketIO = require("socket.io");
const config = require("../../lib/config");
const dashboardAgent = require("../../lib/dashboard-agent");

describe("dashboard-agent", () => {

  describe("initialization", () => {

    it("should use environment variables for configuration", (done) => {
      const TEST_PORT = 12345;
      process.env[config.PORT_KEY] = TEST_PORT;
      process.env[config.BLOCKED_THRESHOLD_KEY] = 0;

      const checkMetrics = (metrics) => {
        expect(metrics).to.be.defined;
        expect(metrics.eventLoop.delay).to.be.zero;
      };

      const server = new SocketIO(TEST_PORT);
      server.on("connection", (socket) => {
        expect(socket).to.be.defined;

        socket.on("metrics", (data) => { //eslint-disable-line max-nested-callbacks
          checkMetrics(JSON.parse(data));
          server.close();
          done();
        });
      });

      dashboardAgent();
    });
  });

  describe("reporting", () => {
    it("should provide basic metrics", (done) => {
      const TEST_PORT = 12345;
      process.env[config.PORT_KEY] = TEST_PORT;

      const checkMetrics = (metrics) => {
        expect(metrics).to.be.defined;
        expect(metrics.eventLoop.delay).to.be.zero;
        expect(metrics.eventLoop.high).to.be.zero;
        expect(metrics.mem).exist;
        expect(metrics.mem.systemTotal).to.be.above.zero;
        expect(metrics.mem.rss).to.be.above.zero;
        expect(metrics.mem.heapTotal).to.be.above.zero;
        expect(metrics.mem.heapUsed).to.be.above.zero;
        expect(metrics.cpu.utiization).to.be.above.zero;
      };

      const server = new SocketIO(TEST_PORT);
      server.on("connection", (socket) => {
        socket.on("metrics", (data) => {
          checkMetrics(JSON.parse(data));
          server.close();
          done();
        });
      });

      dashboardAgent();
    });
  });
});
