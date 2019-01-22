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
var justCleared = false;
var justClicked = false;
var colorpicker = document.getElementById('colorBtn');
var canvas = document.getElementById('canvas');
canvas.width = 800;
canvas.height = 600;
var last_data_size = 1;
var context = canvas.getContext('2d');

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
		socket.emit('drawer', drawer);
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
}, 10);

////////////////////
// Socket receive //
////////////////////

// Game state //
socket.on('state', function(data) {
	// Only draw the last two points, prevents redrawing all points //
	if (data.x.length == 0) { context.clearRect(0, 0, canvas.width, canvas.height); }
	for (i = last_data_size - 1; i < (data.x.length - 1); i++)
	{
		// This uses the coordinates (0,0) to designate the end of a line segment //
		// This checks to make sure neither of the two points are the end of a segment //
		if ((data.x[i] != -1) && (data.y[i] != -1) && (data.x[i + 1] != -1) && (data.y[i + 1] != -1) && !data.beingFilled[i]) {
			context.strokeStyle = data.colors[i];
			context.fillStyle = data.colors[i];
			context.lineWidth = 10;
			context.beginPath();
			context.moveTo(data.x[i], data.y[i]);
			context.lineTo(data.x[i + 1], data.y[i + 1]);
			context.stroke();
			context.beginPath();
			context.arc(data.x[i], data.y[i], 5, 0, 2 * Math.PI);
			context.fill();
			context.beginPath();
			context.arc(data.x[i + 1], data.y[i + 1], 5, 0, 2 * Math.PI);
			context.fill();
		}
		// If the point signifies a fill point, call the flood fill algorithm //
		if (data.beingFilled[i]) {
			// Must convert hexidecimal color format to RGBa //
			floodFill(data.x[i], data.y[i], colorToRBGa(data.colors[i]));
		}
	}
	last_data_size = data.x.length;
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
function floodFill(dataX, dataY, dataColor) {
	// Grab color of spot being clicked //
	originalColor = context.getImageData(dataX, dataY, 1, 1).data ;
	originalColor = {
		r:originalColor[0],
		g:originalColor[1],
		b:originalColor[2],
		a:originalColor[3]
	};
	x = dataX;
	y = dataY;
	// Set area to check //
	searchArea = context.getImageData(0, 0, canvas.width, canvas.height);
	// Go up from original point until finding a boundary //
	// Use linear coordinates //
	linearCoords = (y * canvas.width + x) * 4;
	var done = false ;
	while((y >= 0) && (!done)) {
		// Update position //
		var newLinearCoords = ((y - 1) * canvas.width + x) * 4;
		// Check for no boundary //
		if ((searchArea.data[newLinearCoords] == originalColor.r) && (searchArea.data[newLinearCoords + 1] == originalColor.g) && (searchArea.data[newLinearCoords + 2] == originalColor.b) && (searchArea.data[newLinearCoords+3]==originalColor.a)) {
			y = y - 1;
			linearCoords = newLinearCoords;
		}
		else {
			done = true;
		}
	}
	// Loop around counter-clockwise until returning to starting position //
	// This essentially traces the outline of the boundary, and then fills it in //
	var path = [{x:x, y:y}];
	var firstIteration = true;
	var iterationCount = 0;
	// 0 = up, 1 = left, 2 = down, 3 = right //
	var orientation = 1;
	while (!((path[path.length - 1].x == path[0].x) && (path[path.length - 1].y == path[0].y)) || (firstIteration)) {
		iterationCount++;
		firstIteration = false;
		var completed = false;
		// Determine which direction we are currently pointing //
		if(path.length >= 2) {
			if (path[path.length - 1].y - path[path.length - 2].y < 0) {
				orientation = 0;
			}
			else if (path[path.length - 1].x - path[path.length - 2].x < 0) {
				orientation = 1;
			}
			else if (path[path.length - 1].y - path[path.length - 2].y > 0) {
				orientation = 2;
			}
			else if (path[path.length - 1].x - path[path.length - 2].x > 0) {
				orientation = 3;
			}
			else {
				//
			}
		}
		// Begin checking where to go next //
		// If we can't find a place to go, change the direction and check again //
		for (var i = 0; (!completed) && (i <= 3); i++) {
			var newOrientation = (orientation + i) % 4;
			if (newOrientation == 0) {
				// Try the right //
				if ((!completed) && (x + 1 < canvas.width)) {
					linearCoords = (y * canvas.width + (x + 1)) * 4;
					if ((searchArea.data[linearCoords] == originalColor.r) && (searchArea.data[linearCoords + 1] == originalColor.g) && (searchArea.data[linearCoords + 2] == originalColor.b) && (searchArea.data[linearCoords + 3] == originalColor.a)) {
						completed = true;
						x = x + 1;
					}
				}
			}
			else if (newOrientation == 1) {
				// Try up //
				if ((!completed) && (y - 1 >= 0)) {
					linearCoords = ((y - 1) * canvas.width + x) * 4;
					if ((searchArea.data[linearCoords] == originalColor.r) && (searchArea.data[linearCoords + 1] == originalColor.g) && (searchArea.data[linearCoords + 2] == originalColor.b) && (searchArea.data[linearCoords + 3] == originalColor.a)) {
						completed = true;
						y = y - 1;
					}
				}
			}
			else if (newOrientation == 2) {
				// Try the left //
				if ((!completed) && (x - 1 >= 0)) {
					linearCoords = (y * canvas.width + (x - 1)) * 4;
					if ((searchArea.data[linearCoords] == originalColor.r) && (searchArea.data[linearCoords + 1] == originalColor.g) && (searchArea.data[linearCoords + 2] == originalColor.b) && (searchArea.data[linearCoords + 3] == originalColor.a)) {
						completed = true;
						x = x - 1;
					}
				}
			}
			else if (newOrientation == 3) {
				// Try down //
				if((!completed) && (y + 1 < canvas.height)) {
					linearCoords = ((y + 1) * canvas.width + x) * 4;
					if ((searchArea.data[linearCoords] == originalColor.r) && (searchArea.data[linearCoords + 1] == originalColor.g) && (searchArea.data[linearCoords + 2] == originalColor.b) && (searchArea.data[linearCoords + 3] == originalColor.a)) {
						completed = true;
						y = y + 1;
					}
				}
			}
		}
		// If possible, continue the path //
		if( completed ) {
			path.push({x:x, y:y});
		}
	}
	// Once done, draw the quadratic curve, and fill it with the chosen color //
	drawQuadCurve(path, context, dataColor, 5, dataColor);
}

// Draw quadratic curve function // 
function drawQuadCurve(path, context, color, thickness, fillColor) {
	// Reformat RGBa color values for HTML5 drawing //
	color = "rgba( " + color.r + "," + color.g + ","+ color.b + ","+ color.a + ")";
	fillColor = "rgba( " + fillColor.r + "," + fillColor.g + ","+ fillColor.b + ","+ fillColor.a + ")";
	context.strokeStyle = color;
	context.fillStyle = fillColor;
	context.lineWidth = thickness;
	context.lineJoin = "round";
	context.lineCap = "round";
	if (path.length > 0) {
		// If path just two points, draw a circle instead //
		if (path.length < 3) {
			var b = path[0];
			context.beginPath();
			context.arc(b.x, b.y, context.lineWidth / 2, 0, Math.PI * 2, !0);
			context.fill();
			context.closePath();
		}
		else {
			context.beginPath();
			// Start curve //
			context.moveTo(path[0].x, path[0].y);
			// Draw curve to each point along the path //
			for (var i = 1; i < path.length - 2; i++) {
				var c = (path[i].x + path[i + 1].x) / 2;
				var d = (path[i].y + path[i + 1].y) / 2;
				context.quadraticCurveTo(path[i].x, path[i].y, c, d);
			}
			// Close path //
			context.quadraticCurveTo(path[i].x, path[i].y, path[i + 1].x, path[i + 1].y);
			context.stroke();
		}
	}
	// Fill curve //
	if (fillColor !== false ) {
		context.fill();
	}
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