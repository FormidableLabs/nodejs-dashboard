"use strict";

var SocketIO = require("socket.io-client");

// Writer for socket.io. Does not write/emit message if the socket is not connected.
// If messages are sent and there is not a receiver, messages will be buffered
// indefinately causing a memory leak.
// Potentially related to: https://github.com/socketio/socket.io-client/issues/845
module.exports = function create(options) {

  var connected = false;

  var socket = new SocketIO("http://localhost:" + options.port);

  socket.on("connect", function socketOnConnect() {
    connected = true;
  });

  socket.on("reconnect", function socketOnReconnect() {
    connected = true;
  });

  socket.on("disconnect", function socketOnDisconnect() {
    connected = false;
  });

  var write = function write(name, data) {
    if (connected && socket) {
      socket.emit(name, data);
    }
  };

  var close = function close() {
    if (socket) {
      socket.close();
      socket = null;
      connected = false;
    }
  };

  return {
    write: write,
    close: close
  };
};
