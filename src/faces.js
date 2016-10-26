var Noise = require('noisejs').Noise;
var maxEyeHeight = 0.25;
var maxEyeWidth = 0.25;
var maxEyeDistance = 0.4;
var maxMouthPos = 0.5;
var maxMouthHeight = 0.5;
var maxMouthWidth = 0.95;

var maxNoseHeight = 0.15;
var maxNoseWidth = 0.25;

var faceHeight = 200;
var faceWidth = 200;

function face(canvas) {

  var t = 0;

  canvas.width = window.innerWidth * 0.7;
  canvas.height = canvas.width;

  faceHeight = canvas.height;
  faceWidth = canvas.width;

  var eyeNoise = new Noise(Math.random());
  var noise = new Noise(Math.random());

  var ctx = canvas.getContext('2d');

  var leftEye, rightEye, leftPupil, rightPupil, nose, mouth, eyeDistance, mouthHeight;

  function update() {
    eyeDistance = maxEyeDistance * (1 + eyeNoise.perlin2(t/100, 0.35)) * 0.5;
    mouthHeight = maxMouthPos * (1 + noise.perlin2(t/100, 0.04)) * 0.5;
    leftEye = {
      height: (1 + eyeNoise.perlin2(t/100, 0.15)) * 0.5 * faceHeight * maxEyeHeight,
      width: (1 + eyeNoise.perlin2(t/100, 0.2)) * 0.5 * faceWidth * maxEyeWidth
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
      height: 0.5 * (1 + noise.perlin2(t/100, 0.65)) * faceHeight * maxNoseHeight,
      width: 0.5 * (1 + noise.perlin2(t/100, 0.35)) * faceWidth * maxNoseWidth
    };

    mouth = {
      height: 0.5 * (1 + noise.perlin2(t/100, 0.75)) * faceHeight * maxMouthHeight,
      width: 0.5 * (1 + noise.perlin2(t/100, 0.85)) * faceWidth * maxMouthWidth,
      sadness: noise.perlin2(t/100, 0.9)
    };
    t+=0.1;
  }


  function drawEyes() {
    var leftX = (faceWidth * 0.5) - (faceWidth * eyeDistance);
    var rightX = (faceWidth * 0.5) + (faceWidth * eyeDistance);
    var eyeY = faceHeight * 0.25;
    ctx.lineWidth = faceWidth * 0.02;
    ctx.fillStyle = "#FAEFEE";
    ctx.beginPath();
    ctx.ellipse(leftX, eyeY, leftEye.width, leftEye.height, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(rightX, eyeY, rightEye.width, rightEye.height, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    // pupil
    var leftPupilX = leftX + (Math.sin(leftPupil.angle) * leftPupil.radius);
    var rightPupilX = rightX + (Math.sin(rightPupil.angle) * rightPupil.radius);
    var leftPupilY = eyeY + (Math.cos(leftPupil.angle) * leftPupil.radius);
    var rightPupilY = eyeY + (Math.cos(rightPupil.angle) * rightPupil.radius);
    ctx.beginPath();
    ctx.fillStyle = "#000000";
    ctx.ellipse(leftPupilX, leftPupilY, leftPupil.width, leftPupil.width, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightPupilX, rightPupilY, rightPupil.width, rightPupil.width, 0, 0, 2*Math.PI);
    ctx.fill();
  }

  function drawNose() {
    var x = faceWidth * 0.5;
    var y = faceHeight * 0.5;
    ctx.beginPath();
    ctx.fillStyle="#ff4625";
    ctx.ellipse(x, y, nose.width, nose.height, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  function drawMouth() {
    var x = faceWidth * 0.5;
    var y = faceHeight * 0.5 + faceHeight * mouthHeight;
    var startX = x - (mouth.width / 2);
    var startY = y;
    var endX = x + (mouth.width / 2);
    var endY = y;
    var cp1x = startX + 10;
    var cp2x = endX - 10;
    var cp1y = y + (mouth.height * mouth.sadness);
    var cp2y = cp1y;
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
