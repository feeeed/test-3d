import * as THREE from 'three'
import { loadJSON } from './JSONHelper';

export async function loadCurveJSON(pathJSON, scene){

    let curveJSON = await loadJSON(pathJSON);
    let curve = createCurve(curveJSON);
    let curveMesh = getMeshCurve(curve,curveJSON);

    let curveAndMesh = {
        curve: curve,
        mesh: curveMesh
    }

    return curveAndMesh;
}

function createCurve(json){
    const vert = json.points;
    const points = [];
    
    for(let i = 0; i< vert.length; i+=3){
        const x = vert[i].x;
        const y = vert[i].y;
        const z = vert[i].z;
        points.push(new THREE.Vector3(x,y,z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return curve;
}

function getMeshCurve(curve,json){
    const geometry = new THREE.TubeGeometry(curve, 100, .05, 8, true);
    const material = new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true});
    const mesh = new THREE.Mesh(geometry,material);

    return mesh;
}