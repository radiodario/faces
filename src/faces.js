var FaceModel = require('./faceModel');

var faceHeight = 200;
var faceWidth = 200;

function backingScale(context) {
    if ('devicePixelRatio' in window) {
        if (window.devicePixelRatio > 1) {
            return window.devicePixelRatio;
        }
    }
    return 1;
}

function face(canvas) {

  var t = 0;

  var ctx = canvas.getContext('2d');

  var scaleFactor = backingScale(ctx);

  var w = (window.innerWidth) * 0.95;
  var h = (window.innerHeight) * 0.95;

  canvas.width = Math.min(w, h);
  canvas.height = Math.min(w, h);

  if (scaleFactor > 1) {
    canvas.width = canvas.width * scaleFactor;
    canvas.height = canvas.height * scaleFactor;

    ctx = canvas.getContext('2d');
  }

  faceHeight = canvas.height;
  faceWidth = canvas.width;

  var faceModel = FaceModel(faceHeight, faceWidth);

  function drawEyes(face) {
    ctx.lineWidth = faceWidth * 0.02;
    ctx.fillStyle = "#FAEFEE";
    ctx.beginPath();
    ctx.ellipse(face.leftEye.x, face.leftEye.y, face.leftEye.width, face.leftEye.height, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(face.rightEye.x, face.rightEye.y, face.rightEye.width, face.rightEye.height, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    // pupil
    var leftPupilX = face.leftEye.x + (Math.cos(face.leftPupil.angle) * face.leftPupil.radius);
    var rightPupilX = face.rightEye.x + (Math.cos(face.rightPupil.angle) * face.rightPupil.radius);
    var leftPupilY = face.leftEye.y + (Math.sin(face.leftPupil.angle) * face.leftPupil.radius);
    var rightPupilY = face.rightEye.y + (Math.sin(face.rightPupil.angle) * face.rightPupil.radius);
    ctx.beginPath();
    ctx.fillStyle = "#000000";
    ctx.ellipse(leftPupilX, leftPupilY, face.leftPupil.width, face.leftPupil.width, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightPupilX, rightPupilY, face.rightPupil.width, face.rightPupil.width, 0, 0, 2*Math.PI);
    ctx.fill();
  }

  function drawNose(face) {
    var x = face.nose.x;
    var y = face.nose.y;
    ctx.beginPath();
    ctx.fillStyle="#ff4625";
    ctx.ellipse(x, y, face.nose.width, face.nose.height, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  function drawMouth(face) {
    if (face.mouth.open > 0.005) {
      drawOpenMouth(face);
    } else {
      drawClosedMouth(face);
    }
  }

  function drawOpenMouth(face) {
    var x = face.mouth.x;
    var y = face.mouth.y;
    ctx.beginPath();
    ctx.fillStyle="#100";
    ctx.ellipse(x, y, face.mouth.width/2, face.mouth.height*face.mouth.open, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  function drawClosedMouth(face) {
    var x = face.mouth.x;
    var y = face.mouth.y;
    var startX = x - (face.mouth.width / 2);
    var startY = y;
    var endX = x + (face.mouth.width / 2);
    var endY = y;
    var cp1x = startX + 10;
    var cp2x = endX - 10;
    var cp1y = y + (face.mouth.height * face.sadness);
    var cp2y = cp1y;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.stroke();
  }

  return function update(time) {
    ctx.clearRect(0, 0, canvas.height, canvas.width);
    var face = faceModel.compute(time);
    drawEyes(face);
    drawMouth(face);
    drawNose(face);
  }
}

module.exports = face;
