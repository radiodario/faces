let Faces = require('./faces');


const canvas = document.querySelector('canvas');

const drawFace = Faces(canvas);


function draw() {
  drawFace();
  requestAnimationFrame(draw);
}

//draw();
