// Dependencies //
const express = require("express");
const path = require("path");
const socketIO = require("socket.io");
const POINTS_LIMIT = 4096;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

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
  var tempX = [];
  var tempY = [];
  var tempC = [];
  var tempF = [];
  var wantUpdate = false;
  var nextUpdate = true;
  var lastX = 0;
  var lastY = 0;
  var lastColors = 'black';
  var lastBeingFilled = false;
  var needUpdate = false;

  //TODO: add variable identifiers
  // Check socket //
  io.on("connection", function(socket) {
    // When a new player joins //
    socket.on("new player", function() {
      needUpdate = true;
    });
    // When a drawer sends data //
    socket.on("drawer", function(data) {
      // Check size of points //
      if (points.x.length > POINTS_LIMIT) {
        // Truncate points //
        tempX = points.x.slice(points.x.length - POINTS_LIMIT + 1, points.x.length);
        tempY = points.y.slice(points.y.length - POINTS_LIMIT + 1, points.y.length);
        tempC = points.colors.slice(points.colors.length - POINTS_LIMIT + 1, points.colors.length);
        tempF = points.beingFilled.slice(points.beingFilled.length - POINTS_LIMIT + 1, points.beingFilled.length);
        // Clear points arrays //
        points.x = [];
        points.y = [];
        points.colors = [];
        points.beingFilled = [];
        // Reassign to points arrays //
        points.x = tempX;
        points.y = tempY;
        points.colors = tempC;
        points.beingFilled = tempF;
      }
      // If the drawer was clicking inside canvas, record point data //
      if (data.clicking && (data.x <= CANVAS_WIDTH) && (data.y <= CANVAS_HEIGHT)) {
        temp = points.x.length;
        if (justClicked && justFilled > 0) {
          points.beingFilled[temp] = false;
        }
        else {
          points.beingFilled[temp] = data.filling;
          justFilled += data.filling;
        }
        points.x[temp] = data.x;
        points.y[temp] = data.y;
        points.colors[temp] = data.myColor;
        justClicked = true;
        wantUpdate = true;
        nextUpdate = true;
      }
      // Either end the line segment or don't record data //
      else {
        // End the line segment using coordinate (-1, -1) //
        if (justClicked) {
          temp = points.x.length;
          points.x[temp] = -1;
          points.y[temp] = -1;
          points.colors[temp] = data.myColor;
          points.beingFilled[temp] = false;
          justClicked = false;
          justFilled = 0;
          wantUpdate = false;
        }
      }
      // If the drawer is clearing the canvas //
      if (data.clearing) {
        points = {
          x: [],
          y: [],
          colors: [],
          beingFilled: []
        };
        wantUpdate = true;
        nextUpdate = false;
      }
    });
  });

  // Emit gamestate //
  setInterval(() => {
    if (needUpdate || ((wantUpdate) && ((points.x[points.x.length - 1] != lastX) || (points.y[points.y.length - 1] != lastY) || (points.colors[points.colors.length - 1] != lastColors) || (points.beingFilled[points.beingFilled.length - 1] != lastBeingFilled)))) {
      io.sockets.emit("state", points);
      //console.log(points.x.length);
      lastX = points.x[points.x.length - 1];
      lastY = points.y[points.y.length - 1];
      lastColors = points.colors[points.colors.length - 1];
      lastBeingFilled = points.beingFilled[points.beingFilled.length - 1];
      needUpdate = false;
    }
  }, 1000 / 60);

  return "ONLINE";
};
