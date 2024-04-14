import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Scène, caméra et renderer
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
  80,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 5;

// Chargement de la texture pour le sol
var textureLoader = new THREE.TextureLoader();
textureLoader.load("./textures/rocky_trail_diff_4k.jpg", function (texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  var groundMaterial = new THREE.MeshBasicMaterial({ map: texture });
  var groundGeometry = new THREE.PlaneGeometry(100, 100);
  var ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
});

// Cube/Voiture
var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
var cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(-25, 0.5, 1);
scene.add(cube);

// Variables de mouvement
var move = { forward: false, backward: false, left: false, right: false };
var velocity = new THREE.Vector3();
var acceleration = 5;
var maxSpeed = 10;
var rotationSpeed = 3;

// Variables pour suivre la direction de la voiture
var carDirection = new THREE.Vector3();
var cameraOffset = new THREE.Vector3(0, 2, 5);

// Gestionnaires d'événements pour les contrôles du clavier
document.addEventListener("keydown", function (event) {
  switch (event.key) {
    case "z":
      move.forward = true;
      break;
    case "s":
      move.backward = true;
      break;
    case "q":
      move.left = true;
      break;
    case "d":
      move.right = true;
      break;
  }
});
document.addEventListener("keyup", function (event) {
  switch (event.key) {
    case "z":
      move.forward = false;
      break;
    case "s":
      move.backward = false;
      break;
    case "q":
      move.left = false;
      break;
    case "d":
      move.right = false;
      break;
  }
});

// Mise à jour du mouvement
function updateMovement(delta) {
  // Accélération et décélération
  if (move.forward) {
    velocity.z -= acceleration * delta;
    if (velocity.z < -maxSpeed) {
      velocity.z = -maxSpeed;
    }
  }
  if (move.backward) {
    velocity.z += acceleration * delta;
    if (velocity.z > 0) {
      velocity.z = 0;
    }
  }

  // Rotation de la voiture
  if (move.left) {
    cube.rotation.y += rotationSpeed * delta;
  }
  if (move.right) {
    cube.rotation.y -= rotationSpeed * delta;
  }

  // Mise à jour de la position de la voiture
  cube.getWorldDirection(carDirection);
  cube.position.addScaledVector(carDirection, velocity.z * delta);
}

// Barriers array for collision detection
var barriers = [];

// Function to place barriers in a circular pattern
function placeCircularBarrier(centerX, centerZ, radius, numSegments) {
  var angleStep = (Math.PI * 2) / numSegments;
  for (let i = 0; i < numSegments; i++) {
    let angle = i * angleStep;
    let x = centerX + radius * Math.cos(angle);
    let z = centerZ + radius * Math.sin(angle);

    var barrierGeometry = new THREE.BoxGeometry(5.2, 0.5, 0.5);
    var barrier = new THREE.Mesh(
      barrierGeometry,
      new THREE.MeshBasicMaterial({ color: 0x0000ff })
    );
    barrier.position.set(x, 0.25, z);
    barrier.lookAt(new THREE.Vector3(centerX, barrier.position.y, centerZ));
    scene.add(barrier);
    barriers.push(barrier);
  }
}

placeCircularBarrier(0, 0, 30, 36);
placeCircularBarrier(0, 0, 20, 36);

// Start line setup
var startLineMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
var poleGeometry = new THREE.BoxGeometry(0.1, 2, 0.1);
var pole1 = new THREE.Mesh(poleGeometry, startLineMaterial);
var pole2 = new THREE.Mesh(poleGeometry, startLineMaterial);
pole1.position.set(-28, 1, 0);
pole2.position.set(-22, 1, 0);
scene.add(pole1);
scene.add(pole2);

// Timer setup
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
    difference = updatedTime - startTime + savedTime;
  } else {
    difference = updatedTime - startTime;
  }
  let hours = Math.floor(
    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  let seconds = Math.floor((difference % (1000 * 60)) / 1000);
  let milliseconds = Math.floor((difference % 1000) / 10);

  document.getElementById(
    "timer"
  ).innerHTML = `${hours}:${minutes}:${seconds}:${milliseconds}`;
}

// Vérification du franchissement de la ligne de départ
function checkStartLine() {
  var cubePosition = cube.position.z;
  var pole1Position = pole1.position.z;
  var pole2Position = pole2.position.z;

  // Vérifier si le cube franchit la ligne de départ pour la première fois
  if (
    cubePosition >= pole1Position &&
    cubePosition <= pole2Position &&
    velocity.z < 0 &&
    !hasCrossedStartLine
  ) {
    // Le cube franchit la ligne de départ pour la première fois
    startTimer(); // Démarrer le chronomètre
    hasCrossedStartLine = true;
  }
}

// Collision Detection
function checkCollisions() {
  var cubeBox = new THREE.Box3().setFromObject(cube);
  for (let barrier of barriers) {
    var barrierBox = new THREE.Box3().setFromObject(barrier);
    if (cubeBox.intersectsBox(barrierBox)) {
      cube.position.set(-25, 0.5, 1); // Réinitialiser la position du cube en cas de collision
      stopTimer(); // Mettre en pause le chronomètre en cas de collision
      break;
    }
  }
}

// Animation loop
var prevTime = performance.now();
function animate() {
  var time = performance.now();
  var delta = (time - prevTime) / 1000; // time delta in seconds
  prevTime = time;

  requestAnimationFrame(animate);
  updateMovement(delta);
  checkCollisions();
  checkStartLine();
  camera.position.copy(cube.position);
  camera.position.add(cameraOffset);
  camera.lookAt(cube.position);
  renderer.render(scene, camera);
}

animate();

window.addEventListener(
  "resize",
  function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  },
  false
);
