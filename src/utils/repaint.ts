import * as THREE from "three";
import type { Palette } from "../data/characters";

export function repaintCharacter(model: THREE.Object3D, palette: Palette) {
  model.traverse((o) => {
    const mesh = o as THREE.SkinnedMesh;
    if (mesh.isSkinnedMesh) paint(mesh, palette);
  });
}

const c = (hex: string) => new THREE.Color(hex);
const mix = (a: THREE.Color, b: THREE.Color, t: number) => a.clone().lerp(b, THREE.MathUtils.clamp(t, 0, 1));
const smooth = (x: number, a: number, b: number) => THREE.MathUtils.smoothstep(x, a, b);

function paint(mesh: THREE.SkinnedMesh, pal: Palette) {
  const geo = mesh.geometry;
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const si = geo.getAttribute("skinIndex") as THREE.BufferAttribute;
  const sw = geo.getAttribute("skinWeight") as THREE.BufferAttribute;
  const bones = mesh.skeleton.bones;
  const n = pos.count;

  const dom: string[] = new Array(n);
  for (let i = 0; i < n; i++) {
    let best = 0, bw = -1;
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k);
      if (w > bw) { bw = w; best = si.getComponent(i, k); }
    }
    dom[i] = bones[best].name.replace(/^mixamorig:?/, "");
  }

  let y0 = Infinity, y1 = -Infinity, f0 = Infinity, f1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < n; i++) {
    if (dom[i] !== "Head") continue;
    const y = pos.getY(i), f = -pos.getX(i), z = pos.getZ(i);
    y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    f0 = Math.min(f0, f); f1 = Math.max(f1, f);
    z0 = Math.min(z0, z); z1 = Math.max(z1, z);
  }
  const zc = (z0 + z1) / 2, hh = y1 - y0;

  const skin = c(pal.skin), hair = c(pal.hair), coat = c(pal.coat), trim = c(pal.trim);
  const pants = c(pal.pants), boots = c(pal.boots), belt = c(pal.belt);
  const gloves = pal.gloves ? c(pal.gloves) : skin;
  const eyes = c(pal.eyes), lips = c(pal.lips), goggles = c(pal.goggles ?? pal.hair);
  const colors = new Float32Array(n * 3);
  const col = new THREE.Color();

  for (let i = 0; i < n; i++) {
    const name = dom[i];
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const fwd = -x;

    if (name === "Head") {
      const ny = (y - y0) / (y1 - y0), nf = (fwd - f0) / (f1 - f0);
      const side = Math.abs(z - zc) / hh; 
      const hairAmt = Math.max(smooth(ny, 0.52, 0.66), 1 - smooth(nf, 0.3, 0.46), smooth(side, 0.3, 0.36));
      col.copy(mix(skin, hair, hairAmt));
      const faceAmt = 1 - hairAmt;
      if (pal.goggles && ny > 0.56 && ny < 0.8 && nf > 0.5) {
        const ring = smooth(side, 0.12, 0.2) * (1 - smooth(side, 0.4, 0.48));
        col.copy(mix(col, goggles, ring * 0.9));
      }
      const eye = Math.hypot((side - 0.2) / 0.06, (ny - 0.46) / 0.05);
      if (nf > 0.7) col.copy(mix(col, eyes, (1 - smooth(eye, 0.7, 1.15)) * faceAmt));
      const mouth = Math.hypot(side / 0.1, (ny - 0.2) / 0.035);
      if (nf > 0.75) col.copy(mix(col, lips, (1 - smooth(mouth, 0.7, 1.2)) * faceAmt * 0.8));
    } else if (name === "Neck") {
      col.copy(skin);
    } else if (/Hand/.test(name)) {
      col.copy(gloves);
    } else if (/Foot|Toe/.test(name)) {
      col.copy(boots);
    } else if (/Leg$/.test(name) && !/Up/.test(name)) {
      col.copy(mix(mix(pants, boots, 1 - smooth(y, 0.14, 0.2)), coat, smooth(y, 0.26, 0.29)));
    } else if (/UpLeg/.test(name)) {
      col.copy(mix(pants, coat, smooth(y, 0.26, 0.29)));
    } else {
      col.copy(coat);
      if (/Hips|Spine$/.test(name)) col.copy(mix(col, belt, smooth(y, 0.5, 0.52) * (1 - smooth(y, 0.57, 0.6))));
      if (/Spine|Hips/.test(name) && fwd > 0) col.copy(mix(col, trim, (1 - smooth(Math.abs(z), 0.004, 0.012)) * 0.7));
    }

    const shade = 0.78 + 0.22 * Math.min(1, y / 0.9);
    colors[i * 3] = col.r * shade;
    colors[i * 3 + 1] = col.g * shade;
    colors[i * 3 + 2] = col.b * shade;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const old = mesh.material as THREE.MeshStandardMaterial;
  old.map = null;
  old.normalMap = null; 
  old.metalnessMap = null;
  old.roughnessMap = null;
  old.vertexColors = true;
  old.color.set("#c9c9c9"); 
  old.metalness = 0.02;
  old.roughness = 0.72;
  old.needsUpdate = true;
}
