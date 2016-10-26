var Noise = require('noisejs').Noise;
var maxEyeHeight = 0.25;
var maxEyeWidth = 0.25;
var maxEyeDistance = 0.4;
var maxMouthHeight = 0.5;
var maxMouthWidth = 0.95;

var maxNoseHeight = 0.15;
var maxNoseWidth = 0.25;

var faceHeight = 200;
var faceWidth = 200;

function face(canvas) {

  let t = 0;

  faceHeight = canvas.height;
  faceWidth = canvas.width;

  var eyeNoise = new Noise(Math.random());
  var noise = new Noise(Math.random());

  const ctx = canvas.getContext('2d');

  var leftEye, rightEye, leftPupil, rightPupil, nose, mouth, eyeDistance;

  function update() {
    eyeDistance = maxEyeDistance * (1 + eyeNoise.perlin2(t/100, 0.05)) * 0.5;
    leftEye = {
      height: (1 + eyeNoise.perlin2(t/100, 0.01)) * 0.5 * faceHeight * maxEyeHeight,
      width: (1 + eyeNoise.perlin2(t/100, 0.1)) * 0.5 * faceWidth * maxEyeWidth
    };

    rightEye = {
      height: 0.5 * (1 + eyeNoise.perlin2(t/100, 0.25)) * faceHeight * maxEyeHeight,
      width: 0.5 * (1 + eyeNoise.perlin2(t/100, 0.3)) * faceWidth * maxEyeWidth
    };

    leftPupil = {
      angle : 2*Math.PI  * (1 + eyeNoise.perlin2(t/100, 0.1)),
      radius : 0.5 * (1+ eyeNoise.perlin2(t/100, 0.12)) * leftEye.width * 0.5,
      width : 0.5 * (1+ eyeNoise.perlin2(t/100, 0.15)) * leftEye.width * 0.5
    };

    rightPupil = {
      angle : 2*Math.PI * (1 + eyeNoise.perlin2(t/100, 0.1)),
      radius : 0.5 * (1+ eyeNoise.perlin2(t/100, 0.12)) * rightEye.width * 0.5,
      width : 0.5 * (1+ eyeNoise.perlin2(t/100, 0.15)) * rightEye.width * 0.5
    };

    nose = {
      height: 0.5 * (1 + noise.perlin2(t/100, 0.5)) * faceHeight * maxNoseHeight,
      width: 0.5 * (1 + noise.perlin2(t/100, 0.55)) * faceWidth * maxNoseWidth
    };

    mouth = {
      height: 0.5 * (1 + noise.perlin2(t/100, 0.75)) * faceHeight * maxMouthHeight,
      width: 0.5 * (1 + noise.perlin2(t/100, 0.85)) * faceWidth * maxMouthWidth,
      sadness: noise.perlin2(t/100, 0.9)
    };
    t+=1;
  }


  function drawEyes() {
    const leftX = (faceWidth * 0.5) - (faceWidth * eyeDistance);
    const rightX = (faceWidth * 0.5) + (faceWidth * eyeDistance);
    const eyeY = faceHeight * 0.25;
    ctx.beginPath();
    ctx.ellipse(leftX, eyeY, leftEye.width, leftEye.height, 0, 0, 2*Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(rightX, eyeY, rightEye.width, rightEye.height, 0, 0, 2*Math.PI);
    ctx.stroke();
    // pupil
    const leftPupilX = leftX + (Math.sin(leftPupil.angle) * leftPupil.radius);
    const rightPupilX = rightX + (Math.sin(rightPupil.angle) * rightPupil.radius);
    const leftPupilY = eyeY + (Math.cos(leftPupil.angle) * leftPupil.radius);
    const rightPupilY = eyeY + (Math.cos(rightPupil.angle) * rightPupil.radius);
    ctx.beginPath();
    ctx.ellipse(leftPupilX, leftPupilY, leftPupil.width, leftPupil.width, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightPupilX, rightPupilY, rightPupil.width, rightPupil.width, 0, 0, 2*Math.PI);
    ctx.fill();
  }

  function drawNose() {
    const x = faceWidth * 0.5;
    const y = faceHeight * 0.5;
    ctx.beginPath();
    ctx.ellipse(x, y, nose.width, nose.height, 0, 0, 2*Math.PI);
    ctx.stroke();
  }

  function drawMouth() {
    const x = faceWidth * 0.5;
    const y = faceHeight * 0.75;
    const startX = x - (mouth.width / 2);
    const startY = y;
    const endX = x + (mouth.width / 2);
    const endY = y;
    const cp1x = startX;
    const cp2x = endX;
    const cp1y = y + (mouth.height * mouth.sadness);
    const cp2y = cp1y;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.stroke();
  }

  return function drawFace() {
    ctx.clearRect(0, 0, canvas.height, canvas.width);
    update();
    drawNose();
    drawEyes();
    drawMouth();
  }
}

module.exports = face;
