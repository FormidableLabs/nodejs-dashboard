"use strict";

var SocketIO = require("socket.io-client");

// Writer for socket.io. Does not write/emit message if the socket is not connected.
// If messages are sent and there is not a receiver, messages will be buffered
// indefinately causing a memory leak.
// Potentially related to: https://github.com/socketio/socket.io-client/issues/845
module.exports = function create(options) {

  var connected;

  var socket = new SocketIO("http://localhost:" + options.port);

  socket.on('connect', function() {
    connected = true;
  });

  socket.on('reconnect', function() {
    connected = true;
  });

  socket.on('disconnect', function() {
    connected = false;
  });

  return {
    write: function(name, data) {
      if(connected) {
        return socket.emit(name, data);
      }
    }
  };
};
