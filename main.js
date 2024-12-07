import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';






const scene = new THREE.Scene();
const light = new THREE.DirectionalLight(0xFFFFFF,10);
scene.add(light);
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor( 0xfffff, 0);
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );


camera.position.z = 45;
camera.position.y = 45;
camera.position.x = 5;
camera.rotateX(56);


const loader = new GLTFLoader();
loader.load('/lab.glb', function (gltf){
  scene.add(gltf.scene);
})
 

function animate() {

	renderer.render( scene, camera );

}