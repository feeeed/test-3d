import * as THREE from "three";
import { DRACOLoader, GLTFLoader } from "three/examples/jsm/Addons.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { loadCurveJSON } from "../tools/CreateCurve";


import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import fragment from "../wire.frag";
import vertex from "../wire.vert";



import { addBarycentricCoordinates } from "../geom";
import { handleScroll, updatePosition } from "../tools/PositionAlongPathMethods";
import PositionAlongPathState from "../tools/PositionAlongPathState";



export async function setupScene() {
    // creating a tools constants
    const params = {
      threshold: 0.5,
      strength: 1.046,
      radius: 0.29,
      exposure: 1
    };
    

// creating a environments THREE constants
const scene = new THREE.Scene();
const clock = new THREE.Clock();
const light = new THREE.DirectionalLight(0xffffff, 5);
const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
// const controls = new OrbitControls(camera, renderer.domElement);
let mixer = null;
let composer;

let curvePath = await loadCurveJSON('testCurve.json',scene);
console.log(curvePath)

camera.position.copy(curvePath.curve.getPointAt(0))
camera.lookAt(curvePath.curve.getPointAt(0.99))

scene.add(camera);
// let positionAlongPathState = new PositionAlongPathState();
// window.addEventListener('wheel', onMouseScroll, false);

// function onMouseScroll(event){
//   handleScroll(event, positionAlongPathState);
  
// }


const controls = new OrbitControls( camera, renderer.domElement );


// adds constants at scene
scene.add(light);

//effects on render

const gl = renderer.getContext();
gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
renderer.setClearColor("#141626", 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);

const renderScene = new RenderPass( scene, camera );

const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
				bloomPass.threshold = params.threshold;
				bloomPass.strength = params.strength;
				bloomPass.radius = params.radius;

        const outputPass = new OutputPass();


        composer = new EffectComposer( renderer );
				composer.addPass( renderScene );
				composer.addPass( bloomPass );
				composer.addPass( outputPass );


// HTML DOCUMENT
document.body.appendChild(renderer.domElement);

// Setting up usage camera
// Default preferences
// camera.position.z = -100;
// camera.position.y = 20;
// camera.position.x = -30;
// camera.rotateY(2.5);


// Creating materials and shaders
const material = new THREE.ShaderMaterial({
  extensions: {
    derivatives: true,
  },
  transparent: true,
  side: THREE.DoubleSide,
  uniforms: {
    time: { value: 0 },
    fill: { value: new THREE.Color("#ffffff") },
    stroke: { value: new THREE.Color("#ededed") },
    noiseA: { value: false },
    noiseB: { value: false },
    dualStroke: { value: true },
    seeThrough: { value: true },
    insideAltColor: { value: true },
    thickness: { value: 0.1 },
    secondThickness: { value: 1.0 },
    dashEnabled: { value: true },
    dashRepeats: { value: 5 },
    dashOverlap: { value: true },
    dashLength: { value: 0.5 },
    dashAnimate: { value: true },
    squeeze: { value: true },
    squeezeMin: { value: 0.01 },
    squeezeMax: { value: 0.04 },
  },
  fragmentShader: fragment,
  vertexShader: vertex,
});

// -------LOADER--------
// Init loader



// SetUp loader
const promise = new Promise((resolve,reject)=>{
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderConfig({ type: "js" });
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
  loader.setDRACOLoader(dracoLoader);
  loader.load("arolf.glb", function (gltf) {
    // new material on load scene
    console.log(gltf.scene.children);
    
    // function findMeshRec(children){
    //   for(const item of children){
    //     item.material = material;
    //     if(item.type === 'Mesh' && item.geometry){
          
    //       console.log(item)
    //       let geometry = item.geometry;
    //       if (item.geometry.index) {
    //         item.geometry = geometry.toNonIndexed();
    //       }
    //         addBarycentricCoordinates(item.geometry, true);
    //     }
    //     if(item.children){
    //       findMeshRec(item.children)
    //     }
    //   }
    // }
    // findMeshRec(gltf.scene.children)

    



    // gltf.scene.children.forEach((child, index) => {
    //   
      
  
    //   if (child.geometry) {
    //     let geometry = child.geometry;
    //     if (child.geometry.index) {
    //       child.geometry = geometry.toNonIndexed();
    //     }
    //     addBarycentricCoordinates(child.geometry, true);
    //   }
    // });
    // init animations on load scene
    mixer = new THREE.AnimationMixer(gltf.scene);
    gltf.animations.forEach((animation, index) => {
      const action = mixer.clipAction(animation);
      action.play();
    });
    scene.add(gltf.scene);
    controls.update();
    resolve(gltf);
  });
})

promise.then((result)=>{
  console.log(result)
})

console.log(scene)





// const boxGeo = new THREE.BoxGeometry(35,35,35);
// const boxMat = new THREE.MeshStandardMaterial({color: 0x00ff00});
// const box = new THREE.Mesh(boxGeo,boxMat);
// scene.add(box);


// const curvePoints = [];
// fetch('cameraPath.json').then((res)=> {
//   return res.json();
// }).then((data)=> {
//   data.points.forEach(element => {
//     curvePoints.push(new THREE.Vector3(element.x,element.y,element.z));
//   });
//   console.log(curvePoints)
// })
// curve = new THREE.CatmullRomCurve3(curvePoints);
// curve.closed = false;

// camera.position.copy(curve.getPointAt(0))

// console.log(curve)


// MAIN FUNCTION

async function  animate() {
  const deltaTime = clock.getDelta();
  const elipsedTime = clock.getElapsedTime();
  // controls.update();
  material.uniforms.time.value = elipsedTime;
  // await updatePosition(curvePath, camera, positionAlongPathState);
  renderer.render(scene, camera);
  if (mixer) {
    mixer.update(deltaTime);
  }
}
}


