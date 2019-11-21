/* eslint-disable no-magic-numbers */

"use strict";

const { expect } = require("chai");
const sinon = require("sinon");

const SocketIO = require("socket.io");
const config = require("../../lib/config");
const dashboardAgent = require("../../lib/dashboard-agent");
const pusage = require("pidusage");
const { tryCatch } = require("../utils");

describe.skip("dashboard-agent", () => {
  let sandbox;
  let server;
  let agent;
  const TEST_PORT = 12345;

  before(() => {
    sandbox = sinon.createSandbox();
    process.env[config.PORT_KEY] = TEST_PORT;
    process.env[config.BLOCKED_THRESHOLD_KEY] = 1;
    process.env[config.REFRESH_INTERVAL_KEY] = 10;
  });

  beforeEach(() => {
    agent = dashboardAgent();
    server = new SocketIO(TEST_PORT);
  });

  afterEach((done) => {
    agent.destroy();
    sandbox.restore();
    server.close(done);
  });

  describe("initialization", () => {
    it("should use environment variables for configuration", (done) => {
      const checkMetrics = function (metrics) {
        expect(metrics).to.be.an("object");
        expect(metrics.eventLoop.delay).to.be.a("number");
      };

      server.on("connection", (socket) => {
        try {
          expect(socket).to.be.an("object");
          socket.on("error", done);
        } catch (err) {
          done(err);
        }
        socket.on("metrics", (data) => {
          tryCatch(done, () => {
            socket.removeAllListeners("metrics");
            checkMetrics(JSON.parse(data));
          });
        });
      });
    });
  });

  describe("reporting", () => {
    it("should provide basic metrics", (done) => {
      const checkMetrics = function (metrics) {
        expect(metrics).to.be.an("object");
        expect(metrics.eventLoop.delay).to.be.a("number");
        expect(metrics.eventLoop.high).to.be.a("number");
        expect(metrics.mem.systemTotal).to.equal(20);
        expect(metrics.mem.rss).to.equal(30);
        expect(metrics.mem.heapTotal).to.equal(40);
        expect(metrics.mem.heapUsed).to.equal(50);
        expect(metrics.cpu.utilization).to.equal(60);
      };

      sandbox.stub(process, "memoryUsage").callsFake(() => ({
        systemTotal: 20,
        rss: 30,
        heapTotal: 40,
        heapUsed: 50
      }));

      sandbox.stub(pusage, "stat").callsFake((processId, callback) => {
        expect(processId).to.equal(process.pid);
        expect(callback).to.be.a("function");

        callback(null, { cpu: 60 });
      });

      agent._getStats((err, metrics) => {
        tryCatch(done, () => {
          expect(err).to.be.null;
          checkMetrics(metrics);
        });
      });
    });

    it("should report an event loop delay and cpu stats", (done) => {
      const delay = { current: 100,
        max: 150 };
      const pusageResults = { cpu: 50 };
      sandbox.stub(pusage, "stat").yields(null, pusageResults);

      agent._delayed(delay.max);
      agent._delayed(delay.current);

      const checkMetrics = function (metrics) {
        expect(metrics.eventLoop.delay).to.equal(delay.current);
        expect(metrics.eventLoop.high).to.equal(delay.max);
        expect(metrics.cpu.utilization).to.equal(pusageResults.cpu);
      };

      agent._getStats((err, metrics) => {
        tryCatch(done, () => {
          expect(err).to.be.null;
          checkMetrics(metrics);
        });
      });
    });

    it("should return an error when pusage fails", (done) => {
      sandbox.stub(pusage, "stat").yields(new Error("bad error"));

      agent._getStats((err, metrics) => {
        tryCatch(done, () => {
          expect(err).to.exist;
          expect(metrics).to.be.undefined;
          expect(err.message).to.equal("bad error");
        });
      });
    });
  });
});
