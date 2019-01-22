// Dependencies //
const express = require("express");
const path = require("path");
const socketIO = require("socket.io");

module.exports = server => {
	var io = socketIO.listen(server);

	// Initialization //
	var players = {};
	var justClicked = false;
	var justFilled = 0;
	var points = {
		x: [],
		y: [],
		colors: [],
		beingFilled: []
	};

  //TODO: add variable identifiers
  // Check socket //
  io.on("connection", function(socket) {
    // When a new player joins //
    socket.on("new player", function() {
      players[socket.id] = {
        //
      };
    });
    // When a drawer send data //
    socket.on("drawer", function(data) {
      // If the drawer was clicking, record point data //
      if (data.clicking) {
        temp = points.x.length;
        if (justClicked && justFilled > 0) {
          points.beingFilled[temp] = false;
        } else {
          points.beingFilled[temp] = data.filling;
          justFilled += data.filling;
        }
        points.x[temp] = data.x;
        points.y[temp] = data.y;
        points.colors[temp] = data.myColor;
        justClicked = true;
      }
      // Either end the line segment or don't record data //
      else {
        // End the line segment using coordinate (0, 0) //
        if (justClicked) {
          temp = points.x.length;
          points.x[temp] = 0;
          points.y[temp] = 0;
          points.colors[temp] = data.myColor;
          points.beingFilled[temp] = false;
          justClicked = false;
          justFilled = 0;
        }
      }
      // If the drawer is clearing the canvas //
      if (data.clearing) {
        points.x = [];
        points.y = [];
        points.colors = [];
        points.beingFilled = [];
      }
    });
  });

  // Emit gamestate //
  setInterval(() => {
    io.sockets.emit("state", points);
  }, 1000 / 60);

  return "ONLINE";
};
