var Faces = require('./faces');

var canvas = document.querySelector('canvas');

var drawFace = Faces(canvas);

function draw(time) {
  drawFace(time);
  requestAnimationFrame(draw);
}

draw(0);
