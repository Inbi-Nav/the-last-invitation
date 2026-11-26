import * as THREE from "three";

export interface CamCfg {
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
}

export const HALL_CAM: CamCfg = { pos: [-0.2, 0.2, 0.75], look: [-0.2, 0.25, 0], fov: 55 };

export function buildCamera(cfg: CamCfg, aspect: number) {
  const cam = new THREE.PerspectiveCamera(cfg.fov, aspect, 0.01, 50);
  cam.position.set(...cfg.pos);
  cam.lookAt(...cfg.look);
  cam.updateMatrixWorld(true);
  return cam;
}

export function placeOnScreen(cfg: CamCfg, aspect: number, ndcX: number, ndcY: number, heightFrac: number, depth: number) {
  const cam = buildCamera(cfg, aspect);
  const halfH = Math.tan(THREE.MathUtils.degToRad(cfg.fov / 2)) * depth;
  const halfW = halfH * aspect;
  const position = new THREE.Vector3(ndcX * halfW, ndcY * halfH, -depth).applyMatrix4(cam.matrixWorld);
  return { position, height: heightFrac * 2 * halfH };
}