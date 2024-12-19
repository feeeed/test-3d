import * as THREE from "three";
import { DRACOLoader, GLTFLoader } from "three/examples/jsm/Addons.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { loadCurveJSON } from "./tools/CreateCurve";

import fragment from "./wire.frag";
import vertex from "./wire.vert";

import palettes from "nice-color-palettes";

import { addBarycentricCoordinates } from "./geom";

// creating a tools constants
let palette = palettes[13].slice();
let pathFromCurve;

// creating a environments THREE constants
const scene = new THREE.Scene();
const clock = new THREE.Clock();
const light = new THREE.DirectionalLight(0xffffff, 5);
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
const controls = new OrbitControls(camera, renderer.domElement);
let mixer = null;

// adds constants at scene
scene.add(light);

//effects on render

const gl = renderer.getContext();
gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
renderer.setClearColor("#141626", 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);

// HTML DOCUMENT
document.body.appendChild(renderer.domElement);

// Setting up usage camera
// Default preferences
camera.position.z = -100;
camera.position.y = 20;
camera.position.x = -30;
camera.rotateY(2.5);

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
    dualStroke: { value: false },
    seeThrough: { value: true },
    insideAltColor: { value: true },
    thickness: { value: 0.01 },
    secondThickness: { value: 0.05 },
    dashEnabled: { value: false },
    dashRepeats: { value: 0 },
    dashOverlap: { value: false },
    dashLength: { value: 0.55 },
    dashAnimate: { value: false },
    squeeze: { value: false },
    squeezeMin: { value: 1 },
    squeezeMax: { value: 1.0 },
  },
  fragmentShader: fragment,
  vertexShader: vertex,
});

// -------LOADER--------
// Init loader
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderConfig({ type: "js" });
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
loader.setDRACOLoader(dracoLoader);

// SetUp loader
loader.load("/lab.glb", function (gltf) {
  // new material on load scene
  console.log(gltf);
  console.log(gltf.cameras)
  gltf.scene.children.forEach((child, index) => {
    child.material = material;
    

    if (child.geometry) {
      let geometry = child.geometry;
      if (child.geometry.index) {
        child.geometry = geometry.toNonIndexed();
      }
      addBarycentricCoordinates(child.geometry, true);
    }
  });
  // init animations on load scene
  mixer = new THREE.AnimationMixer(gltf.scene);
  gltf.animations.forEach((animation, index) => {
    const action = mixer.clipAction(animation);
    action.play();
  });
  scene.add(gltf.scene);
});

const boxGeo = new THREE.BoxGeometry(35,35,35);
const boxMat = new THREE.MeshStandardMaterial({color: 0x00ff00});
const box = new THREE.Mesh(boxGeo,boxMat);
scene.add(box);


const curvePoints = [];
fetch('cameraPath.json').then((res)=> {
  return res.json();
}).then((data)=> {
  data.points.forEach(element => {
    curvePoints.push(new THREE.Vector3(element.x,element.y,element.z));
  });
  console.log(curvePoints)
})
const curve = new THREE.CatmullRomCurve3(curvePoints);
console.log(curve)


// MAIN FUNCTION

function animate() {
  renderer.render(scene, camera);
  const deltaTime = clock.getDelta();
  const elipsedTime = clock.getElapsedTime();
  controls.update();
  let position = curve.getPointAt(deltaTime);
  
  
  

  material.uniforms.time.value = elipsedTime;
  if (mixer) {
    mixer.update(deltaTime);
  }
}
