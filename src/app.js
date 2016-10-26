var Faces = require('./faces');

var canvas = document.querySelector('canvas');

var drawFace = Faces(canvas);

function draw() {
  drawFace();
  requestAnimationFrame(draw);
}

draw();
