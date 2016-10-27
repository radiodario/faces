var Noise = require('noisejs').Noise;
var dat = require('dat-gui');

var maxEyeHeight = 0.25;
var maxEyeWidth = 0.25;
var maxEyeDistance = 0.4;
var maxMouthPos = 0.5;
var maxMouthHeight = 0.5;
var maxMouthWidth = 0.95;

var maxNoseHeight = 0.15;
var maxNoseWidth = 0.25;


function FaceModel(faceHeight, faceWidth) {

  var eyeNoise = new Noise(Math.random());
  var noise = new Noise(Math.random());
  var gui = new dat.GUI();
  dat.GUI.toggleHide();


  var face = {
    eyeDistance : 0.5,
    leftEyeHeight : 0.5,
    leftEyeWidth : 0.5,
    rightEyeHeight : 0.5,
    rightEyeWidth : 0.5,
    leftPupilAngle : 0,
    leftPupilRadius : 0,
    leftPupilWidth: 0.5,
    rightPupilAngle : 0,
    rightPupilRadius : 0,
    rightPupilWidth: 0.5,
    noseHeight: 0.5,
    noseWidth: 0.5,
    mouthX : 0.5,
    mouthHeight: 0.5,
    mouthWidth: 0.5,
    sadness: 0,
    randomize: true
  }
  var t = 0;

  // separate data from display
  function perlin1(x, y) {
    return (1 + noise.perlin2(x, y)) * 0.5;
  }

  gui.add(face, 'eyeDistance', 0, 1).listen();
  gui.add(face, 'leftEyeHeight', 0, 1).listen();
  gui.add(face, 'leftEyeWidth', 0, 1).listen();
  gui.add(face, 'rightEyeHeight', 0, 1).listen();
  gui.add(face, 'rightEyeWidth', 0, 1).listen();
  gui.add(face, 'leftPupilAngle', 0, 1).listen();
  gui.add(face, 'leftPupilRadius', 0, 1).listen();
  gui.add(face, 'leftPupilWidth', 0, 1).listen();
  gui.add(face, 'rightPupilAngle', 0, 1).listen();
  gui.add(face, 'rightPupilRadius', 0, 1).listen();
  gui.add(face, 'rightPupilWidth', 0, 1).listen();
  gui.add(face, 'noseHeight', 0, 1).listen();
  gui.add(face, 'noseWidth', 0, 1).listen();
  gui.add(face, 'mouthX', 0, 1).listen();
  gui.add(face, 'mouthHeight', 0, 1).listen();
  gui.add(face, 'mouthWidth', 0, 1).listen();
  gui.add(face, 'sadness', -1, 1).listen();
  gui.add(face, 'randomize').listen();

  // randomly walks the space of possible faces by using noise
  face.randomTick = function() {
    face.eyeDistance = perlin1(t/100, 0.35);
    face.leftEyeHeight = perlin1(t/100, 0.15);
    face.leftEyeWidth = perlin1(t/100, 0.2);
    face.rightEyeHeight = perlin1(t/100, 0.25);
    face.rightEyeWidth = perlin1(t/100, 0.3);
    face.leftPupilAngle = perlin1(t/100, 0.1);
    face.leftPupilRadius = perlin1(t/100, 0.92);
    face.leftPupilWidth = perlin1(t/100, 0.15)
    face.rightPupilAngle = perlin1(t/100, 0.1);
    face.rightPupilRadius = perlin1(t/100, 0.92);
    face.rightPupilWidth = perlin1(t/100, 0.15)
    face.noseWidth = perlin1(t/100, 0.65);
    face.noseHeight = perlin1(t/100, 0.35);
    face.mouthX = perlin1(t/100, 0.04);
    face.mouthHeight = perlin1(t/100, 0.75);
    face.mouthWidth = perlin1(t/100, 0.85);
    face.sadness = noise.perlin2(t/100, 0.9);
    t+=0.1;
  }

  // translates the face from normalised values to draw space values
  face.compute = function compute() {
    if (face.randomize) {
      face.randomTick();
    }
    var computedFace = {};
    computedFace.eyeDistance = maxEyeDistance * face.eyeDistance;
    computedFace.mouthHeight = maxMouthPos * face.mouthX;
    computedFace.leftEye = {
      x : (faceWidth * 0.5) - (faceWidth * computedFace.eyeDistance),
      y : faceHeight * 0.25,
      height: face.leftEyeHeight * faceHeight * maxEyeHeight,
      width: face.leftEyeWidth * faceWidth * maxEyeWidth
    };

    computedFace.rightEye = {
      x : (faceWidth * 0.5) + (faceWidth * computedFace.eyeDistance),
      y : faceHeight * 0.25,
      height: face.rightEyeHeight * faceHeight * maxEyeHeight,
      width: face.rightEyeWidth * faceWidth * maxEyeWidth
    };

    computedFace.leftPupil = {
      angle : 2 * Math.PI * face.leftPupilAngle,
      radius : face.leftPupilRadius * computedFace.leftEye.width,
      width : face.leftPupilWidth * computedFace.leftEye.width * 0.5
    };

    computedFace.rightPupil = {
      angle : 2 * Math.PI * face.rightPupilAngle,
      radius : face.rightPupilRadius * computedFace.rightEye.width,
      width : face.rightPupilWidth * computedFace.rightEye.width * 0.5
    };

    computedFace.nose = {
      x: faceWidth * 0.5,
      y: faceHeight * 0.5,
      height: face.noseHeight * faceHeight * maxNoseHeight,
      width: face.noseWidth * faceWidth * maxNoseWidth
    };

    computedFace.mouth = {
      x: faceWidth * 0.5,
      y: faceHeight * 0.5 + (faceHeight * 0.5 * face.mouthX),
      height: face.mouthHeight * faceHeight * maxMouthHeight,
      width: face.mouthWidth * faceWidth * maxMouthWidth
    };
    computedFace.sadness = face.sadness;
    return computedFace
  }

  return face;
}

module.exports = FaceModel;
