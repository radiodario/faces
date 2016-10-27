var Noise = require('noisejs').Noise;
var dat = require('dat-gui');
var firebase = require('firebase');
var TWEEN = require('tween.js');

var config = {
  apiKey: "AIzaSyARob6Peh7tIeue1ro1gHCuDsDQhDjapH0",
  authDomain: "face-3c1e5.firebaseapp.com",
  databaseURL: "https://face-3c1e5.firebaseio.com",
  storageBucket: "face-3c1e5.appspot.com",
  messagingSenderId: "466860282"
};
firebase.initializeApp(config);
var facedb = firebase.database();

var maxEyeHeight = 0.25;
var maxEyeWidth = 0.25;
var maxEyeDistance = 0.4;
var maxMouthPos = 0.5;
var maxMouthHeight = 0.5;
var maxMouthWidth = 0.95;

var maxNoseHeight = 0.15;
var maxNoseWidth = 0.25;
var face = {
  eyeDistance : 0.5,
  leftEyeHeight : 0.5,
  leftEyeWidth : 0.5,
  rightEyeHeight : 0.5,
  rightEyeWidth : 0.5,
  leftPupilAngle : 0.0,
  leftPupilRadius : 0.0,
  leftPupilWidth: 0.5,
  rightPupilAngle : 0,
  rightPupilRadius : 0,
  rightPupilWidth: 0.5,
  noseHeight: 0.5,
  noseWidth: 0.5,
  mouthX : 0.5,
  mouthOpen : 0,
  mouthHeight: 0.5,
  mouthWidth: 0.5,
  sadness: 0.0
};

var control = {
  randomize: false,
  listen: true,
  timestep: 0.1,
  weight: 0.0001,
  animationTime: 1000
};

function FaceModel(faceHeight, faceWidth) {

  var eyeNoise = new Noise(Math.random());
  var noise = new Noise(Math.random());
  var gui = new dat.GUI();
  dat.GUI.toggleHide();

  var t = 0;


  faceRef = facedb.ref('face');
  faceRef.on('value', function(snapshot) {
    if (!control.listen) return;
    // newest value is king
    TWEEN.removeAll();
    var newFace = snapshot.val();
    if (control.animationTime) {
      var tween = new TWEEN.Tween(face)
        .to(newFace, control.animationTime)
        .easing(TWEEN.Easing.Quadratic.In)
        .start();
    } else {
      Object.assign(face, newFace);
    }
  });

  controlRef = facedb.ref('control');
  controlRef.on('value', function(snapshot) {
    Object.assign(control, snapshot.val());
  })

  // separate data from display
  function perlin1(x, y) {
    return control.weight * noise.perlin2(x, y);
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
  gui.add(face, 'mouthOpen', 0, 1).listen();
  gui.add(face, 'sadness', -1.0, 1.0).listen();
  gui.add(control, 'randomize').listen();
  gui.add(control, 'listen').listen();
  gui.add(control, 'timestep', 0, 10).listen();
  gui.add(control, 'weight', 0, 0.01).listen();

  // randomly walks the space of possible faces by using noise
  face.randomTick = function() {
    face.eyeDistance += perlin1(t/100, 0.35);
    face.leftEyeHeight += perlin1(t/100, 0.15);
    face.leftEyeWidth += perlin1(t/100, 0.2);
    face.rightEyeHeight += perlin1(t/100, 0.25);
    face.rightEyeWidth += perlin1(t/100, 0.3);
    face.leftPupilAngle += perlin1(t/100, 0.1);
    face.leftPupilRadius += perlin1(t/100, 0.92);
    face.leftPupilWidth += perlin1(t/100, 0.15)
    face.rightPupilAngle += perlin1(t/100, 0.1);
    face.rightPupilRadius += perlin1(t/100, 0.92);
    face.rightPupilWidth += perlin1(t/100, 0.15)
    face.noseWidth += perlin1(t/100, 0.65);
    face.noseHeight += perlin1(t/100, 0.35);
    face.mouthX += perlin1(t/100, 0.04);
    face.mouthHeight += perlin1(t/100, 0.75);
    face.mouthWidth += perlin1(t/100, 0.85);
    face.sadness += perlin1(t/100, 0.9);
    t += control.timestep;
  }

  // translates the face from normalised values to draw space values
  face.compute = function compute(time) {
    TWEEN.update(time);
    if (control.randomize) {
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
      width: face.mouthWidth * faceWidth * maxMouthWidth,
      open: face.mouthOpen
    };
    computedFace.sadness = face.sadness;
    return computedFace
  }

  return face;
}

module.exports = FaceModel;
