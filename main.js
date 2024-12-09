import * as THREE from 'three';
import { DRACOLoader, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { Clock, time } from 'three/webgpu';






const scene = new THREE.Scene();
const light = new THREE.DirectionalLight(0xFFFFFF,5);
scene.add(light);
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor( 0xfffff, 0);
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

let mixer = null;


camera.position.z = -100;
camera.position.y = 20;
camera.position.x = -30;
camera.rotateY(2.5)



const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderConfig({ type: 'js' });
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
loader.setDRACOLoader(dracoLoader);
loader.load('/lab.glb', function (gltf){
  gltf.scene.children.forEach((child,index)=>{
    console.log(child)
    let mat = new THREE.MeshBasicMaterial({
      color: 0x000ff1,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    });
    child.material = mat

  })
  console.log(gltf);


  mixer = new THREE.AnimationMixer(gltf.scene);
  gltf.animations.forEach((animation,index)=>{
    const action = mixer.clipAction(animation);
    action.play();
  })


  // const action = mixer.clipAction(gltf.animations[2]);
  // action.play();

  scene.add(gltf.scene);
})

const clock = new THREE.Clock();
function animate() {

	renderer.render( scene, camera );
  const deltaTime = clock.getDelta();
  if (mixer) {
    mixer.update(deltaTime)
  }

  //camera.rotateY(0.003)
}