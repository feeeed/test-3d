import * as THREE from "three";

import { GUI } from "three/addons/libs/lil-gui.module.min.js";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { addBarycentricCoordinates } from "./geom";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
// import { LightningStrike } from "three/addons/geometries/LightningStrike.js";
import fragment from "./wire.frag";
import vertex from "./wire.vert";

let camera;
let composer, renderer, mixer, clock;
const lightningStrikes = [];
const lightningStrikeMeshs = [];
const outlineMeshArray = [];
const lightningStrikes2 = [];
const lightningStrikeMeshs2 = [];
const outlineMeshArray2 = [];

let cube1, cube2;

const cubes = [];
const cubes2 = [];
const background = "#141626";

const params = {
  threshold: 0,
  strength: 0.345,
  radius: 0,
  exposure: 16.0,
};
let colorParams = {
  fill: "#3884ff",
  stroke: "#22167e"

}
const rayParams = {
  sourceOffset: new THREE.Vector3(),
  destOffset: new THREE.Vector3(),
  radius0: 0.005,
  radius1: 0.005,
  minRadius: 2.5,
  maxIterations: 7,
  isEternal: true,

  timeScale: 1.7,

  propagationTimeFactor: 0.05,
  vanishingTimeFactor: 0.95,
  subrayPeriod: 2.5,
  subrayDutyCycle: 0.3,
  maxSubrayRecursion: 3,
  ramification: 7,
  recursionProbability: 0.6,

  roughness: 0.85,
  straightness: 0.9,
};
const material = new THREE.ShaderMaterial({
  extensions: {
    derivatives: true,
  },
  transparent: true,
  side: THREE.DoubleSide,
  uniforms: {
    time: { value: 0 },
    fill: { value: new THREE.Color(colorParams.fill) },
    stroke: { value: new THREE.Color(colorParams.stroke) },
    noiseA: { value: true },
    noiseB: { value: false },
    dualStroke: { value: false },
    seeThrough: { value: true },
    insideAltColor: { value: true },
    thickness: { value: 0.1 },
    secondThickness: { value: 0.05 },
    dashEnabled: { value: true },
    dashRepeats: { value: 3 },
    dashOverlap: { value: true },
    dashLength: { value: 0.2 },
    dashAnimate: { value: true },
    squeeze: { value: false },
    squeezeMin: { value: 0.2 },
    squeezeMax: { value: 2.0 },
  },
  fragmentShader: fragment,
  vertexShader: vertex,
});

clock = new THREE.Clock();


const scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(-13,1.5,-5.5);
scene.add(camera);

scene.add(new THREE.AmbientLight(0xcccccc));

const pointLight = new THREE.PointLight(0xffffff, 100);
camera.add(pointLight);

const loader = new GLTFLoader();
const gltf = await loader.loadAsync("logo_final.glb");

const model1 = gltf.scene.children[0];
model1.material = material;
let geometry = model1.geometry;
if (model1.geometry.index) {
  model1.geometry = geometry.toNonIndexed();
}
addBarycentricCoordinates(model1.geometry, true);
console.log(model1)

const model2 = gltf.scene.children[1];
model2.material = material;
let geometry2 = model2.geometry;
if (model2.geometry.index) {
  model2.geometry2 = geometry2.toNonIndexed();
}
addBarycentricCoordinates(model2.geometry, true);

const model = gltf.scene;
scene.add(model);
const gui = new GUI();
setupGUI();


//

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 16;
document.body.appendChild(renderer.domElement);

//
function createOutline(scene, objectsArray) {
  const outlinePass = new OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera,
    objectsArray
  );
  outlinePass.edgeStrength = 2;
  outlinePass.edgeGlow = 2.5;
  outlinePass.edgeThickness = 1;
  outlinePass.visibleEdgeColor.set(0x00aaff);
  composer.addPass(outlinePass);
  return outlinePass;
}

// function recreateRay(rayParams, count, lightningStrikes, outlineMeshArray) {
//   for (let i = 0; i < count; i++) {
//     const lightningStrike = new LightningStrike(rayParams);
//     const lightningStrikeMesh = new THREE.Mesh(
//       lightningStrike,
//       new THREE.MeshBasicMaterial({ color: 0xffffff })
//     );
//     lightningStrikes.push(lightningStrike);
//     outlineMeshArray.push(lightningStrikeMesh);
//     scene.add(lightningStrikeMesh);
//   }
// }

// function renderBolt(bolt, lastcube) {
//   lightningStrikes[bolt].rayParameters.sourceOffset.copy(
//     cubes[lastcube].position
//   );
//   lightningStrikes[bolt].rayParameters.destOffset.copy(cubes[0].position);
// }
// function renderBolt2(bolt, lastcube) {
//   lightningStrikes2[bolt].rayParameters.sourceOffset.copy(
//     cubes2[lastcube].position
//   );
//   lightningStrikes2[bolt].rayParameters.destOffset.copy(cubes2[0].position);
// }

//

const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
);
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const outputPass = new OutputPass();

composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(outputPass);

// recreateRay(rayParams, 16, lightningStrikes, outlineMeshArray);
// recreateRay(rayParams, 17, lightningStrikes2, outlineMeshArray2);

// createOutline(scene, model1, new THREE.Color(0x0000ff));
// createOutline(scene, outlineMeshArray2, new THREE.Color(0x0000ff));

const controls = new OrbitControls(camera, renderer.domElement);
controls.maxPolarAngle = Math.PI * 0.5;
controls.minDistance = 3;
controls.maxDistance = 18;

//
function setupGUI(){
  console.log('$$$$$gui is load$$$$$')
  const shader = gui.addFolder("Шейдер");
  const guiData = {
    name: 'TorusKnot',
    edgeRemoval: true,
    fillHex: `#${model1.material.uniforms.fill.value.getHexString()}`,
    strokeHex: `#${model1.material.uniforms.stroke.value.getHexString()}`
  };
  Object.keys(model1.material.uniforms).forEach(key => {
    const uniform = model1.material.uniforms[key];
    if (typeof uniform.value === 'boolean' || typeof uniform.value === 'number') {
      guiData[key] = uniform.value;
    }
  });



  const updateColors = () =>{
    model1.material.uniforms.fill.value.setStyle(guiData.fillHex);
    model1.material.uniforms.stroke.value.setStyle(guiData.strokeHex);
  };

  const updateUniforms = () => {
    Object.keys(guiData).forEach(key => {
      if (key in model1.material.uniforms) {
        model1.material.uniforms[key].value = guiData[key];
      }
    });
  };

  shader.addColor(guiData,'fillHex').name('Fill').onChange(updateColors);
  shader.addColor(guiData,'strokeHex').name('Stroke').onChange(updateColors);
  shader.add(guiData, 'seeThrough').name('See Through').onChange(updateUniforms);
  shader.add(guiData, 'thickness', 0.005, 0.2).step(0.001).name('Thickness').onChange(updateUniforms);

  const dash = shader.addFolder('Dash');
  dash.add(guiData, 'dashEnabled').name('Enabled').onChange(updateUniforms);
  dash.add(guiData, 'dashAnimate').name('Animate').onChange(updateUniforms);
  dash.add(guiData, 'dashRepeats', 1, 10).step(1).name('Repeats').onChange(updateUniforms);
  dash.add(guiData, 'dashLength', 0, 1).step(0.01).name('Length').onChange(updateUniforms);
  dash.add(guiData, 'dashOverlap').name('Overlap Join').onChange(updateUniforms);

  const effects = shader.addFolder('Effects');
  effects.add(guiData, 'noiseA').name('Noise Big').onChange(updateUniforms);
  effects.add(guiData, 'noiseB').name('Noise Small').onChange(updateUniforms);
  effects.add(guiData, 'insideAltColor').name('Backface Color').onChange(updateUniforms);
  effects.add(guiData, 'squeeze').name('Squeeze').onChange(updateUniforms);
  effects.add(guiData, 'squeezeMin', 0, 1).step(0.01).name('Squeeze Min').onChange(updateUniforms);
  effects.add(guiData, 'squeezeMax', 0, 1).step(0.01).name('Squeeze Max').onChange(updateUniforms);
  effects.add(guiData, 'dualStroke').name('Dual Stroke').onChange(updateUniforms);
  effects.add(guiData, 'secondThickness', 0, 0.2).step(0.001).name('Dual Thick').onChange(updateUniforms);



}



const bloomFolder = gui.addFolder("bloom");




// lightningFolder.add(rayParams,"roughness",0.0,1.0).onChange(function (value){
//   rayParams.roughness = Number(value);
// })
// lightningFolder.add(rayParams,"straightness",0.0,1.0).onChange(function (value){
//   rayParams.straightness = Number(value);
// })
// lightningFolder.add(rayParams,"radius0",0.0,1.0).onChange(function (value){
//   rayParams.radius0 = Number(value);
// })
// lightningFolder.add(rayParams,"radius1",0.0,1.0).onChange(function (value){
//   rayParams.radius1 = Number(value);
// })
// lightningFolder.add(rayParams,"timeScale",0.0,1.0).onChange(function (value){
//   rayParams.timeScale = Number(value);
// })

bloomFolder.add(params, "threshold", 0.0, 1.0).onChange(function (value) {
  bloomPass.threshold = Number(value);
});

bloomFolder.add(params, "strength", 0.0, 3.0).onChange(function (value) {
  bloomPass.strength = Number(value);
});

gui
  .add(params, "radius", 0.0, 1.0)
  .step(0.01)
  .onChange(function (value) {
    bloomPass.radius = Number(value);
  });

const toneMappingFolder = gui.addFolder("tone mapping");

toneMappingFolder.add(params, "exposure", 0.1, 2).onChange(function (value) {
  renderer.toneMappingExposure = Math.pow(value, 4.0);
  console.log(renderer.toneMappingExposure)
});

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);
}

window.addEventListener("resize", onWindowResize);
console.log(lightningStrikes);
console.log(lightningStrikes2);

// let t = 0;

function animate() {
  // t += 0.01;
  const delta = clock.getDelta();
  const elipsedTime = clock.getElapsedTime();
  material.uniforms.time.value = elipsedTime;

  // for (let i = 0; i < 15; i++) {
  //   lightningStrikes[i].rayParameters.sourceOffset.copy(cubes[i].position);
  //   lightningStrikes[i].rayParameters.destOffset.copy(cubes[i + 1].position);
  //   lightningStrikes[i].update(t);
  // }
  // for (let i = 0; i < 16; i++) {
  //   lightningStrikes2[i].rayParameters.sourceOffset.copy(cubes2[i].position);
  //   lightningStrikes2[i].rayParameters.destOffset.copy(cubes2[i + 1].position);
  //   lightningStrikes2[i].update(t);
  // }
  // renderBolt(15, 15);
  // lightningStrikes[15].update(t);
  // renderBolt2(16, 16);
  // lightningStrikes2[16].update(t);

  
  composer.render();
}
