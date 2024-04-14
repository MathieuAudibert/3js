import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// -------------------------------------------------------------------TEXTURES---------------------------------------------------------------
var loader = new GLTFLoader();

//--------------------------------------------------------------------CAMERA/SCENES----------------------------------------------------------
console.log(THREE);
var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ---------------------------------------------------------------------SOL-------------------------------------------------------------------
var groundGeometry = new THREE.PlaneGeometry(100, 100, 10, 10); 
var groundMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, wireframe: true }); //mettre wireframe false pour avoir un sol uni
var ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ----------------------------------------------------------------------Cube/voiture----------------------------------------------------------
var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
var cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.y = 0.5;
scene.add(cube);

// ------------------------------------------------------------------------Obstacles------------------------------------------------------------
var rectangles = [];
var rectangle1Geometry = new THREE.BoxGeometry(2, 1, 0.5);
var rectangle1Material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
var rectangle1 = new THREE.Mesh(rectangle1Geometry, rectangle1Material);
rectangle1.position.set(-2, 1.5, 0);
rectangles.push(rectangle1);
scene.add(rectangle1);

var rectangle2Geometry = new THREE.BoxGeometry(1.5, 2, 0.5);
var rectangle2Material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); 
var rectangle2 = new THREE.Mesh(rectangle2Geometry, rectangle2Material);
rectangle2.position.set(2, 1.5, 0);
rectangles.push(rectangle2);
scene.add(rectangle2);

// ------------------------------------------------------------------------Circuit-------------------------------------------------------------
var barrierMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff }); 

function placeCircularBarrier(centerX, centerZ, radius, numSegments) {
    var angleStep = Math.PI * 2 / numSegments;
    for (let i = 0; i < numSegments; i++) {
        let angle = i * angleStep;
        let x = centerX + radius * Math.cos(angle);
        let z = centerZ + radius * Math.sin(angle);

        var barrierGeometry = new THREE.BoxGeometry(2, 0.5, 0.5); 
        var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        barrier.position.set(x, 0.25, z);
        barrier.lookAt(new THREE.Vector3(centerX, barrier.position.y, centerZ)); 

        scene.add(barrier);
    }
}


var centerX = 0;
var centerZ = 0;


var outerRadius = 30;

var innerRadius = 20;

var numSegments = 36; 


placeCircularBarrier(centerX, centerZ, outerRadius, numSegments);


placeCircularBarrier(centerX, centerZ, innerRadius, numSegments);

camera.position.set(centerX, 10, centerZ + 50); 
camera.lookAt(new THREE.Vector3(centerX, 0, centerZ));

// ----------------------------------------------------------------------------Chronometre-----------------------------------------------------
let startTime, updatedTime, difference;
let savedTime;
let running = 0;
let intervalId;

function startTimer() {
  if (!running) {
    startTime = new Date().getTime();
    intervalId = setInterval(getShowTime, 1);
    running = 1;
  }
}

function stopTimer() {
  if (running) {
    clearInterval(intervalId); 
    savedTime = difference;
    running = 0;
  }
}

function getShowTime() {
  updatedTime = new Date().getTime();
  if (savedTime) {
    difference = (updatedTime - startTime) + savedTime;
  } else {
    difference = updatedTime - startTime;
  }
  let hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  let seconds = Math.floor((difference % (1000 * 60)) / 1000);
  let milliseconds = Math.floor((difference % (1000)) / 10);

  document.getElementById("timer").innerHTML = `${hours}:${minutes}:${seconds}:${milliseconds}`;
}

document.getElementById("stopButton").addEventListener("click", stopTimer);

// ----------------------------------------------------------------Déplacements----------------------------------------------------------------
document.addEventListener('keydown', function(event) {
    var newPosition = cube.position.clone();
    switch (event.key) {
      case 'q':
          cube.position.x -= 0.4;
          startTimer();
          break;
      case 'd': 
          cube.position.x += 0.4;
          startTimer();
          break;
      case 'z':
          cube.position.z -= 0.4;
          startTimer();
          break;
      case 's': 
          cube.position.z += 0.4;
          startTimer();
          break;
    }
});


function animate() {
    requestAnimationFrame(animate);

    camera.position.x = cube.position.x;
    camera.position.z = cube.position.z + 5; 
    camera.position.y = cube.position.y + 2;

    camera.lookAt(cube.position);

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);
