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
import { LightningStrike } from "three/addons/geometries/LightningStrike.js";
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
const cubes2 =[];



const params = {
  threshold: 0,
  strength: 0.309,
  radius: 0,
  exposure: 1,
};
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
    straightness: 0.68,
  };
  const material = new THREE.ShaderMaterial({
    extensions: {
      derivatives: true,
    },
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      time: { value: 0 },
      fill: { value: new THREE.Color("#113753") },
      stroke: { value: new THREE.Color("#2986cc") },
      noiseA: { value: false },
      noiseB: { value: false },
      dualStroke: { value: true },
      seeThrough: { value: true },
      insideAltColor: { value: true },
      thickness: { value: 3.5 },
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
  const material2 = new THREE.ShaderMaterial({
    extensions: {
      derivatives: true,
    },
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      time: { value: 0 },
      fill: { value: new THREE.Color("#113753") },
      stroke: { value: new THREE.Color("#2986cc") },
      noiseA: { value: true },
      noiseB: { value: false },
      dualStroke: { value: false },
      seeThrough: { value: true },
      insideAltColor: { value: true },
      thickness: { value: 0.1 },
      secondThickness: { value: 0.1 },
      dashEnabled: { value: true },
      dashRepeats: { value: 1 },
      dashOverlap: { value: true },
      dashLength: { value: 0.2 },
      dashAnimate: { value: true },
      squeeze: { value: false },
      squeezeMin: { value: 0.2 },
      squeezeMax: { value: 1 },
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
  camera.position.set(-5, 2.5, -3.5);
  scene.add(camera);

  scene.add(new THREE.AmbientLight(0xcccccc));

  const pointLight = new THREE.PointLight(0xffffff, 100);
  camera.add(pointLight);

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync("arolf.glb");
  
  await gltf.scene.children.forEach((child) => {
    if (child.name.includes("ls")) {
      cubes.push(child);
    }
    if (child.name.includes("rs")) {
        cubes2.push(child);
      }
  });
  console.log(cubes)
  console.log(cubes2)

  const model1 = gltf.scene.children[1];
  model1.material = material2;
  let geometry = model1.geometry;
  if (model1.geometry.index) {
    model1.geometry = geometry.toNonIndexed();
  }
  addBarycentricCoordinates(model1.geometry, true);

  const model2 = gltf.scene.children[2];
  model2.material = material2;
  let geometry2 = model2.geometry;
  if (model2.geometry.index) {
    model2.geometry2 = geometry2.toNonIndexed();
  }
  addBarycentricCoordinates(model2.geometry, true);

  const model = gltf.scene;
  scene.add(model);

  mixer = new THREE.AnimationMixer(model);
  const clip = gltf.animations[0];
  mixer.clipAction(clip.optimize()).play();

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.toneMapping = THREE.ReinhardToneMapping;
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

  
  

  function recreateRay(rayParams, count,lightningStrikes,outlineMeshArray) {
    for (let i = 0; i < count; i++) {
      const lightningStrike = new LightningStrike(rayParams);
      const lightningStrikeMesh = new THREE.Mesh(lightningStrike, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      lightningStrikes.push(lightningStrike);
      outlineMeshArray.push(lightningStrikeMesh);
      scene.add(lightningStrikeMesh);
    }
  }

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

  recreateRay(rayParams,15,lightningStrikes,outlineMeshArray);
  recreateRay(rayParams,15,lightningStrikes2,outlineMeshArray2);

  createOutline(scene, outlineMeshArray, new THREE.Color(0x0000ff));
  


  //

  //

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.minDistance = 3;
  controls.maxDistance = 8;

  //

  const gui = new GUI();

  const bloomFolder = gui.addFolder("bloom");

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
  console.log(lightningStrikes)
  console.log(lightningStrikes2)


let t = 0;


function animate() {
  t += 0.01;
  const delta = clock.getDelta();
  const elipsedTime = clock.getElapsedTime();
  material.uniforms.time.value = elipsedTime;
  material2.uniforms.time.value = elipsedTime;

  for(let i=0; i < lightningStrikes.length; i++){
    lightningStrikes[i].rayParameters.sourceOffset.copy(cubes[i].position);
    lightningStrikes[i].rayParameters.destOffset.copy(cubes[i+1].position);
    if(lightningStrikes[i]==lightningStrikes.length){
        console.log('asd')
    }
    lightningStrikes[i].update(t)
  }
  for(let i=0; i < lightningStrikes2.length; i++){
    lightningStrikes2[i].rayParameters.sourceOffset.copy(cubes2[i].position);
    lightningStrikes2[i].rayParameters.destOffset.copy(cubes2[i+1].position);
    if(lightningStrikes2[i]==lightningStrikes2.length){
        console.log('asd')
    }
    lightningStrikes2[i].update(t)
  }

    // lightningStrikes[0].rayParameters.sourceOffset.copy(cubes[0].position);
    // lightningStrikes[0].rayParameters.destOffset.copy(cubes[1].position);
    // // lightningStrikes[1].rayParameters.sourceOffset.copy(cubes[1].position);
    // lightningStrikes[1].rayParameters.destOffset.copy(cubes[2].position);

    
    // lightningStrikes[1].update(t)

  

  mixer.update(delta);
  // console.log(lightningStrikes[0])
  

  // lightningStrikes[1].rayParameters.sourceOffset.copy(cubes[1].position);
  // lightningStrikes[1].rayParameters.destOffset.copy(cubes[2].position);

//   lightningStrikes[0].update(t);
//   lightningStrikes[1].update(t);

  // lightningStrike.rayParameters.sourceOffset.copy(cube1.position);
  // lightningStrike.rayParameters.destOffset.copy(cube2.position);

  // lightningStrike2.rayParameters.sourceOffset.copy(cube2.position);
  // lightningStrike2.rayParameters.destOffset.copy(cube3.position);

  // lightningStrike.update(t);
  // lightningStrike2.update(t);

  composer.render();
}
