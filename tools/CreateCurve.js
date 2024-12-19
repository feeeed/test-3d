import * as THREE from 'three'
import { loadJSON } from './JSONHelper';

export async function loadCurveJSON(pathJSON){
    let response = await fetch(pathJSON)
    let temp = await response.json();
    let curveJSON = await loadJSON(pathJSON)
    const curve = createCurve(curveJSON);
    return curve;
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