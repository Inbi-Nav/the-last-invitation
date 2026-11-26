import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

const FBX_URL = "/models/mansion-int.fbx";
const GLB_URL = "/models/mansion-int.glb";

let cache: Promise<THREE.Object3D> | null = null;

function normalize(obj: THREE.Object3D, recenter: boolean): THREE.Object3D {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  if (size.y > 20) obj.scale.setScalar(0.01);
  if (recenter) {
    const next = new THREE.Box3().setFromObject(obj);
    const center = next.getCenter(new THREE.Vector3());
    obj.position.x -= center.x;
    obj.position.z -= center.z;
    obj.position.y -= next.min.y;
  }
  return obj;
}

export function loadInterior(): Promise<THREE.Object3D> {
  if (!cache) {
    cache = (async () => {
      try {
        const head = await fetch(FBX_URL, { method: "HEAD" });
        if (head.ok) {
          const fbx = await new FBXLoader().loadAsync(FBX_URL);
          return normalize(fbx, true);
        }
        throw new Error("mansion-int.fbx not present");
      } catch {
        const gltf = await new GLTFLoader().loadAsync(GLB_URL);
        return normalize(gltf.scene, false);
      }
    })();
  }
  return cache;
}
