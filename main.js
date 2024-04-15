import * as THREE from "three";

// Scène, Caméra et Rendu
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
  90,
  (window.innerWidth * 0.8) / (window.innerHeight * 0.8),
  0.1,
  1000
);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
document.body.appendChild(renderer.domElement);
camera.position.z = 5;

renderer.domElement.style.position = "absolute";
renderer.domElement.style.left = "10%";
renderer.domElement.style.top = "10%";

// Chargement de la texture du sol
var textureLoader = new THREE.TextureLoader();
textureLoader.load("./textures/rocky_trail_diff_4k.jpg", function (texture) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
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
var move = { avant: false, arrière: false, gauche: false, droite: false };
var velocity = new THREE.Vector3();
var acceleration = 5;
var maxSpeed = 10;
var rotationSpeed = 3;

// Écouteurs d'événements pour les contrôles clavier
document.addEventListener("keydown", function (event) {
  switch (event.key) {
    case "z":
      move.avant = true;
      break;
    case "s":
      move.arrière = true;
      break;
    case "q":
      move.gauche = true;
      break;
    case "d":
      move.droite = true;
      break;
  }
});
document.addEventListener("keyup", function (event) {
  switch (event.key) {
    case "z":
      move.avant = false;
      break;
    case "s":
      move.arrière = false;
      break;
    case "q":
      move.gauche = false;
      break;
    case "d":
      move.droite = false;
      break;
  }
});

// Fonction de mise à jour du mouvement
function updateMovement(delta) {
  if (move.avant) velocity.z -= acceleration * delta;
  if (move.arrière) velocity.z += acceleration * delta;
  if (move.gauche) cube.rotation.y += rotationSpeed * delta;
  if (move.droite) cube.rotation.y -= rotationSpeed * delta;
  velocity.z = Math.max(-maxSpeed, Math.min(velocity.z, 0));
  cube.position.addScaledVector(
    new THREE.Vector3(0, 0, 1).applyQuaternion(cube.quaternion),
    velocity.z * delta
  );
}

// Configuration des barrières
var barriers = [];
function placeCircularBarrier(centerX, centerZ, radius, numSegments) {
  var angleStep = (Math.PI * 2) / numSegments;
  for (let i = 0; i < numSegments; i++) {
    let angle = i * angleStep;
    let x = centerX + radius * Math.cos(angle);
    let z = centerZ + radius * Math.sin(angle);

    var barrierGeometry = new THREE.BoxGeometry(2, 0.5, 0.5);
    var barrierMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier.position.set(x, 0.25, z);
    barrier.lookAt(new THREE.Vector3(centerX, 0.25, centerZ));
    scene.add(barrier);
    barriers.push(barrier);
  }
}

// Configuration des obstacles
var obstacles = [];
function placeObstacles(obstaclePositions) {
  for (let position of obstaclePositions) {
    let x = position[0];
    let z = position[1];

    var obstacleGeometry = new THREE.BoxGeometry(2, 0.5, 0.5);
    var obstacleMaterial = new THREE.MeshBasicMaterial({ color: 0xeeeeee });
    var obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(x, 0.25, z);
    scene.add(obstacle);
    obstacles.push(obstacle);
  }
}

// Appel de la fonction placeObstacles
placeObstacles([
  [-25, 5],
  [-25, -5],
  [-25, -10],
  [-20, -15],
  [-15, -20],
  [-10, -20],
  [-7, -20],
]);

placeObstacles([
  [25, 5],
  [25, -5],
  [25, -10],
  [20, -15],
  [15, -20],
  [10, -20],
  [7, -20],
]);

placeCircularBarrier(0, 0, 30, 36);
placeCircularBarrier(0, 0, 20, 36);

// Fonction pour gérer la collision
function handleCollision() {
  cube.position.set(-25, 0.5, 1);
  cube.rotation.y = 0;
  velocity.set(0, 0, 0);

  // Réinitialise les directions de mouvement
  move.avant = false;
  move.arrière = false;
  move.gauche = false;
  move.droite = false;

  // Gestion du chronomètre
  if (running) {
    stopTimer();
    resetTimer();
  }
}

// Vérification du franchissement de la ligne de départ
function checkStartLine() {
  var cubeBox = new THREE.Box3().setFromObject(cube);
  var startLineLeftBox = new THREE.Box3().setFromObject(startLineLeft);
  var startLineRightBox = new THREE.Box3().setFromObject(startLineRight);

  if (
    cubeBox.intersectsBox(startLineLeftBox) ||
    cubeBox.intersectsBox(startLineRightBox)
  ) {
    if (!running) {
      startTimer();
    } else {
      stopTimer();
      resetTimer();
      startTimer();
    }
  }
}

// Ligne de départ
var startLineMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
var startLineGeometry = new THREE.BoxGeometry(7, 0.1, 0.1);
var startLineLeft = new THREE.Mesh(startLineGeometry, startLineMaterial);
var startLineRight = new THREE.Mesh(startLineGeometry, startLineMaterial);
startLineLeft.position.set(-29, 1, -1);
startLineRight.position.set(-21, 1, -1);
scene.add(startLineLeft);
scene.add(startLineRight);

// Détection des collisions
function checkCollisions() {
  var cubeBox = new THREE.Box3().setFromObject(cube);
  for (let barrier of barriers) {
    var barrierBox = new THREE.Box3().setFromObject(barrier);
    if (cubeBox.intersectsBox(barrierBox)) {
      handleCollision();
      break;
    }
  }
  for (let obstacle of obstacles) {
    var obstacleBox = new THREE.Box3().setFromObject(obstacle);
    if (cubeBox.intersectsBox(obstacleBox)) {
      handleCollision();
      break;
    }
  }
}

var running = false;
var startTime;
var elapsedTime = 0;

function startTimer() {
  if (!running) {
    running = true;
    startTime = Date.now() - elapsedTime;
    setInterval(updateTimer, 100);
  }
}

function stopTimer() {
  if (running) {
    running = false;
    elapsedTime = Date.now() - startTime;
    clearInterval(updateTimer);
  }
}

function resetTimer() {
  running = false;
  elapsedTime = 0;
  document.getElementById("timer").textContent = "00:00:00:00";
}

function updateTimer() {
  if (running) {
    var time = Date.now() - startTime;
    var millis = parseInt((time % 1000) / 10)
      .toString()
      .padStart(2, "0");
    var seconds = parseInt((time / 1000) % 60)
      .toString()
      .padStart(2, "0");
    var minutes = parseInt((time / (1000 * 60)) % 60)
      .toString()
      .padStart(2, "0");
    var hours = parseInt((time / (1000 * 60 * 60)) % 24)
      .toString()
      .padStart(2, "0");
    document.getElementById("timer").textContent =
      hours + ":" + minutes + ":" + seconds + ":" + millis;
  }
}

window.addEventListener(
  "resize",
  function () {
    camera.aspect = (window.innerWidth * 0.8) / (window.innerHeight * 0.8);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
    renderer.domElement.style.left = "10%";
    renderer.domElement.style.top = "10%";
  },
  false
);

// Boucle d'animation
var prevTime = performance.now();
function animate() {
  var time = performance.now();
  var delta = (time - prevTime) / 1000;
  prevTime = time;

  requestAnimationFrame(animate);
  updateMovement(delta);
  checkCollisions();
  checkStartLine();
  camera.position.copy(cube.position);
  camera.position.add(new THREE.Vector3(0, 2, 5));
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
