////////////////////
// Initialization //
////////////////////
var socket = io();
socket.on('message', function(data) {
  console.log(data);
});
var drawer = {
  clicking: false,
  x: 0,
  y: 0,
  clearing: false,
  filling: false,
  myColor: 'black'
};
var lastDrawer = {
  clicking: false,
  x: 0,
  y: 0,
  clearing: true,
  filling: false,
  myColor: 'black'
};
var justCleared = false;
var justClicked = false;
var justFilled = false;
var colorpicker = document.getElementById('colorBtn');
var canvas = document.getElementById('canvas');
canvas.width = 800;
canvas.height = 600;
var last_data_size = 1;
var context = canvas.getContext('2d');
var justFilledX = 0;
var justFilledY = 0;

/////////////////////
// Event Listeners //
/////////////////////

// Pressing the mouse //
document.addEventListener('mousedown', function(event) {
  switch (event.button) {
    case 0:
      drawer.clicking = true;
      justClicked = true;
      break;
    default:
      break;
  }
});
// Releasing the mouse //
document.addEventListener('mouseup', function(event) {
  switch (event.button) {
    case 0:
      drawer.clicking = false;
      break;
    default:
      break;
  }
});
// General mouse tracking //
document.addEventListener('mousemove', function(event) {
  drawer.x = event.clientX - 10;
  drawer.y = event.clientY - 10;
});

/////////////////
// Socket send //
/////////////////

// New player joined //
socket.emit('new player');
// Send drawer information every 10ms //
setInterval(function() {
  // Grab color value from color picker //
  drawer.myColor = colorpicker.value;
  if (justClicked) {
    if ((drawer.clicking != lastDrawer.clicking) || (drawer.x != lastDrawer.x) || (drawer.y != lastDrawer.y) || (drawer.clearing != lastDrawer.clearing) || (drawer.filling != lastDrawer.filling) || (drawer.myColor != lastDrawer.myColor)) {
      socket.emit('drawer', drawer);
    }
    if (!drawer.clicking) {
      justClicked = false;
    }
  }
  // Logic to handle button press //
  if (justCleared == true) {
    drawer.clearing = false;
    justCleared = false;
  }
  if (drawer.clearing == true) {
    justCleared = true;
  }
  lastDrawer.clicking = drawer.clicking;
  lastDrawer.x = drawer.x;
  lastDrawer.y = drawer.y;
  lastDrawer.clearing = drawer.clearing;
  lastDrawer.filling = drawer.filling;
  lastDrawer.myColor = drawer.myColor
}, 10);

////////////////////
// Socket receive //
////////////////////

// Game state //
socket.on('state', function(data) {
  // Only draw the last two points, prevents redrawing all points //
  if (data.x.length == 0) { context.clearRect(0, 0, canvas.width, canvas.height); }
  for (i = last_data_size - 2; i <= (data.x.length); i++)
  {
    // This uses the coordinates (0,0) to designate the end of a line segment //
    // This checks to make sure neither of the two points are the end of a segment //
    if ((data.x[i] != -1) && (data.y[i] != -1) && (data.x[i - 1] != -1) && (data.y[i - 1] != -1) && !data.beingFilled[i] && !data.beingFilled[i - 1])  {
      context.strokeStyle = data.colors[i];
      context.fillStyle = data.colors[i];
      context.lineWidth = 10;
      context.beginPath();
      context.moveTo(data.x[i], data.y[i]);
      context.lineTo(data.x[i - 1], data.y[i - 1]);
      context.stroke();
      context.beginPath();
      context.arc(data.x[i], data.y[i], 5, 0, 2 * Math.PI);
      context.fill();
      context.beginPath();
      context.arc(data.x[i - 1], data.y[i - 1], 5, 0, 2 * Math.PI);
      context.fill();
    }
    else if ((data.x[i] != -1) && (data.y[i] != -1) && (data.x[i - 1] == -1) && (data.y[i - 1] == -1) && !data.beingFilled[i]) {
      context.beginPath();
      context.arc(data.x[i], data.y[i], 5, 0, 2 * Math.PI);
      context.fill();
    }
    else if ((data.x[i] == -1) && (data.y[i] == -1) && (data.x[i - 1] != -1) && (data.y[i - 1] != -1) && !data.beingFilled[i - 1]) {
      context.beginPath();
      context.arc(data.x[i - 1], data.y[i - 1], 5, 0, 2 * Math.PI);
      context.fill();
    }
    // If the point signifies a fill point, call the flood fill algorithm //
    if (data.beingFilled[i]) {
      // Must convert hexidecimal color format to RGBa //
      floodFill(data.x[i], data.y[i], colorToRBGa(data.colors[i]));
    }
  }
  if (data.beingFilled[data.x.length - 1]) {
    last_data_size = data.x.length + 2;
  }
  else {
    last_data_size = data.x.length;
  }
});

/////////////
// Buttons //
/////////////

// Clear button //
function clearFunction() {
  drawer.clearing = true;
}
// Fill button //
function fillFunction() {
  drawer.filling = !drawer.filling;
}

// Flood fill algorithm //
// Stack-based recursive implementation (four-way) //
function floodFill(x, y, color) {
  canvasStack = [{x:x, y:y}];
  canvasPixels = context.getImageData(0, 0, canvas.width, canvas.height);
  // Grab color of coordinate clicked //
  var imageCoords = (y * canvas.width + x) * 4;
  originalColor = {
    r: canvasPixels.data[imageCoords],
    g: canvasPixels.data[imageCoords + 1],
    b: canvasPixels.data[imageCoords + 2],
    a: canvasPixels.data[imageCoords + 3]
  };
  // Only fill if the original color is different from the selected fill color //
  if ((color.r != originalColor.r) || (color.g != originalColor.g) || (color.b != originalColor.b) || (color.a != originalColor.a)) {
    while (canvasStack.length > 0) {
      // Shift new points from the stack //
      newPixel = canvasStack.shift();
      x = newPixel.x;
      y = newPixel.y;
      imageCoords = (y * canvas.width + x) * 4;
      // Start checking downwards //
      while ((y-- >= 0) && ((canvasPixels.data[imageCoords] == originalColor.r) && (canvasPixels.data[imageCoords + 1] == originalColor.g) && (canvasPixels.data[imageCoords + 2] == originalColor.b) && (canvasPixels.data[imageCoords + 3] == originalColor.a))) {
        imageCoords -= canvas.width * 4;
      }
      imageCoords += canvas.width * 4;
      y++;
      // Start checking upwards //
      var reached_left = false;
      var reached_right = false;
      // If pixel hasn't changed, replace it with the fill color //
      while ((y++ < canvas.height) && ((canvasPixels.data[imageCoords] == originalColor.r) && (canvasPixels.data[imageCoords + 1] == originalColor.g) && (canvasPixels.data[imageCoords + 2] == originalColor.b) && (canvasPixels.data[imageCoords + 3] == originalColor.a))) {
        canvasPixels.data[imageCoords]   = color.r;
        canvasPixels.data[imageCoords + 1] = color.g;
        canvasPixels.data[imageCoords + 2] = color.b;
        canvasPixels.data[imageCoords + 3] = color.a;
        // Check left //
        if (x > 0) {
          if ((canvasPixels.data[imageCoords - 4] == originalColor.r) && (canvasPixels.data[imageCoords - 4 + 1] == originalColor.g) && (canvasPixels.data[imageCoords - 4 + 2] == originalColor.b) && (canvasPixels.data[imageCoords - 4 + 3] == originalColor.a )) {
            if (!reached_left) {
              canvasStack.push({x:x - 1, y:y});
              reached_left = true;
            }
          }
          else if (reached_left) {
            reached_left = false;
          }
        }
        // Check right //
        if (x < canvas.width - 1) {
          if ((canvasPixels.data[imageCoords + 4] == originalColor.r) && (canvasPixels.data[imageCoords + 4 + 1] == originalColor.g) && (canvasPixels.data[imageCoords + 4 + 2] == originalColor.b) && (canvasPixels.data[imageCoords + 4 + 3] == originalColor.a)) {
            if (!reached_right) {
              canvasStack.push({x:x + 1, y:y});
              reached_right = true;
            }
          }
          else if (reached_right) {
            reached_right = false;
          }
        }
        imageCoords += canvas.width * 4;
      }
    }
  }
  // Fill the canvas with the specified pixel data //
  context.putImageData(canvasPixels, 0, 0);
}

// Adapted from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb //
function colorToRBGa(color) {
  // Hex notation //
  if(color[0] == "#") {
    color = color.replace("#", "");
    var bigint = parseInt(color, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return {
      r:r,
      g:g,
      b:b,
      a:255
    };
  }
  // RBGa notation //
  else if (color.indexOf("rgba(") == 0) {
    color = color.replace("rgba(", "").replace(" ", "").replace(")", "").split(",");
    return {
      r:color[0],
      g:color[1],
      b:color[2],
      a:color[3] * 255
    };
  } 
  // Error //
  else {
    return {
      r:0,
      g:0,
      b:0,
      a:0
    };
  }
}