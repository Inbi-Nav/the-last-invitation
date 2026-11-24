import * as THREE from "three";

export type FitAxis = "height" | "length" | "width";

export function fitModel(source: THREE.Object3D, size: number, axis: FitAxis = "height") {
  const object = source.clone(true);
  const box = new THREE.Box3().setFromObject(object);
  const dims = box.getSize(new THREE.Vector3());
  const ref = axis === "height" ? dims.y : axis === "length" ? Math.max(dims.x, dims.z) : Math.min(dims.x, dims.z);
  const scale = ref > 0 ? size / ref : 1;
  object.scale.multiplyScalar(scale);
  object.updateMatrixWorld(true);
  const scaled = new THREE.Box3().setFromObject(object);
  const center = scaled.getCenter(new THREE.Vector3());
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= scaled.min.y;
  const wrapper = new THREE.Group();
  wrapper.add(object);
  wrapper.userData.dims = scaled.getSize(new THREE.Vector3());
  wrapper.userData.rawDims = dims;
  return wrapper;
}
