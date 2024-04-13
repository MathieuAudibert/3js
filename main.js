import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
var loader = new GLTFLoader();

THREE.DefaultLoadingManager.setURLModifier((url) => {
    return url.replace(/^textures\//, './textures');
  });

loader.load(
    './scene.gltf', 

    function ( gltf ) {
        var car = gltf.scene;
        car.scale.set(0.5, 0.5, 0.5);
        car.position.set(0, 0, 0); 
        scene.add( car );

        car.position.y = 0.5; 

        animate();
    },
    function ( xhr ) {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    function ( error ) {
        console.log( 'An error happened', error );
    }
);

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


var groundGeometry = new THREE.PlaneGeometry(100, 100, 10, 10); 
var groundMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, wireframe: true }); //mettre wireframe false pour avoir un sol uni
var ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
var cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.y = 0.5;
scene.add(cube);

document.addEventListener('keydown', function(event) {
    switch (event.key) {
        case 'q':
            cube.position.x -= 0.1;
            break;
        case 'd': 
            cube.position.x += 0.1;
            break;
        case 'z':
            cube.position.z -= 0.1;
            break;
        case 's ': 
            cube.position.z += 0.1;
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
