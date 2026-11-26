import * as THREE from "three";

export interface MeshPiece {
  geometry: THREE.BufferGeometry;
  size: THREE.Vector3;
  material: THREE.Material;
}

const QUANT = 1 / 0.002;

export function splitMesh(mesh: THREE.Mesh, count: number, rowSplitZ: number): MeshPiece[] {
  const geo = mesh.geometry;
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const nrm = geo.getAttribute("normal") as THREE.BufferAttribute | undefined;
  const uv = geo.getAttribute("uv") as THREE.BufferAttribute | undefined;
  const index = geo.getIndex();
  if (!index) throw new Error("splitMesh needs an indexed geometry");
  const idx = index.array;
  const nv = pos.count;
  const triCount = idx.length / 3;

  const rep = new Int32Array(nv);
  const seen = new Map<number, number>();
  for (let i = 0; i < nv; i++) {
    const qx = Math.round(pos.getX(i) * QUANT) + 1024;
    const qy = Math.round(pos.getY(i) * QUANT) + 1024;
    const qz = Math.round(pos.getZ(i) * QUANT) + 1024;
    const key = (qx * 4096 + qy) * 4096 + qz;
    const hit = seen.get(key);
    if (hit === undefined) { seen.set(key, i); rep[i] = i; } else rep[i] = hit;
  }

  const parent = new Int32Array(nv).map((_, i) => i);
  const find = (x: number) => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  for (let t = 0; t < idx.length; t += 3) {
    const a = find(rep[idx[t]]);
    for (let k = 1; k < 3; k++) {
      const b = find(rep[idx[t + k]]);
      if (a !== b) parent[b] = a;
    }
  }

  const comps = new Map<number, { tris: number; box: THREE.Box3 }>();
  const triComp = new Int32Array(triCount);
  const v = new THREE.Vector3();
  for (let t = 0; t < triCount; t++) {
    const r = find(rep[idx[t * 3]]);
    triComp[t] = r;
    let c = comps.get(r);
    if (!c) { c = { tris: 0, box: new THREE.Box3() }; comps.set(r, c); }
    c.tris++;
    for (let k = 0; k < 3; k++) c.box.expandByPoint(v.fromBufferAttribute(pos, idx[t * 3 + k]));
  }

  const ranked = [...comps.entries()].sort((a, b) => b[1].tris - a[1].tris);
  const mains = ranked.slice(0, count).map(([root]) => root);
  const centres = new Map(mains.map((r) => [r, comps.get(r)!.box.getCenter(new THREE.Vector3())]));
  const owner = new Map<number, number>();
  mains.forEach((r) => owner.set(r, r));
  const c3 = new THREE.Vector3();
  for (const [root, c] of ranked.slice(count)) {
    c.box.getCenter(c3);
    let best = mains[0], bd = Infinity;
    for (const m of mains) {
      const d = c3.distanceToSquared(centres.get(m)!);
      if (d < bd) { bd = d; best = m; }
    }
    owner.set(root, best);
  }

  // 4. order: row by row, left to right
  const ordered = [...mains].sort((a, b) => {
    const ca = centres.get(a)!, cb = centres.get(b)!;
    const ra = ca.z < rowSplitZ ? 0 : 1, rb = cb.z < rowSplitZ ? 0 : 1;
    return ra !== rb ? ra - rb : ca.x - cb.x;
  });

  // 5. build one geometry per piece
  const remap = new Int32Array(nv);
  return ordered.map((root) => {
    remap.fill(-1);
    const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
    for (let t = 0; t < triCount; t++) {
      if (owner.get(triComp[t]) !== root) continue;
      for (let k = 0; k < 3; k++) {
        const old = idx[t * 3 + k];
        let n = remap[old];
        if (n < 0) {
          n = positions.length / 3;
          remap[old] = n;
          positions.push(pos.getX(old), pos.getY(old), pos.getZ(old));
          if (nrm) normals.push(nrm.getX(old), nrm.getY(old), nrm.getZ(old));
          if (uv) uvs.push(uv.getX(old), uv.getY(old));
        }
        indices.push(n);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    if (nrm) g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    if (uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeBoundingBox();
    const centre = g.boundingBox!.getCenter(new THREE.Vector3());
    g.translate(-centre.x, -centre.y, -centre.z);
    g.computeBoundingBox();
    return {
      geometry: g,
      size: g.boundingBox!.getSize(new THREE.Vector3()),
      material: (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.Material,
    };
  });
}

/** Finds the single mesh in a loaded GLB scene. */
export function firstMesh(scene: THREE.Object3D): THREE.Mesh {
  let found: THREE.Mesh | null = null;
  scene.traverse((o) => {
    if (!found && (o as THREE.Mesh).isMesh) found = o as THREE.Mesh;
  });
  if (!found) throw new Error("GLB contains no mesh");
  return found;
}

const cache = new Map<string, MeshPiece[]>();
/** Splits once per (url, count) and reuses the result. */
export function splitCached(url: string, scene: THREE.Object3D, count: number, rowSplitZ: number) {
  const key = `${url}:${count}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = splitMesh(firstMesh(scene), count, rowSplitZ);
    cache.set(key, hit);
  }
  return hit;
}
