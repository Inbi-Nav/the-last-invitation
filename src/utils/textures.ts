import * as THREE from "three";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function tex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Soft radial glow
export function makeGlowTexture(inner = "rgba(255,255,255,1)", outer = "rgba(255,255,255,0)") {
  const [c, g] = canvas(256, 256);
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, inner);
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  return tex(c);
}

// Puffy cloud / fog blob built from overlapping soft circles
export function makeCloudTexture(seed = 1) {
  const [c, g] = canvas(512, 256);
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 60; i++) {
    const x = 60 + rnd() * 392;
    const y = 90 + rnd() * 90 - Math.abs(x - 256) * 0.12;
    const r = 30 + rnd() * 70;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, "rgba(255,255,255,0.22)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 256);
  }
  return tex(c);
}

// Twisted tree branches silhouette, growing from the left edge
export function makeBranchTexture(seed = 3) {
  const [c, g] = canvas(1024, 1024);
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  g.strokeStyle = "rgb(8,4,12)";
  g.lineCap = "round";
  const branch = (x: number, y: number, ang: number, len: number, w: number, depth: number) => {
    if (depth === 0 || w < 0.6) return;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x, y);
    let cx = x, cy = y, a = ang;
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      a += (rnd() - 0.5) * 0.7;
      cx += Math.cos(a) * (len / steps);
      cy += Math.sin(a) * (len / steps);
      g.lineTo(cx, cy);
    }
    g.stroke();
    const kids = 2 + Math.floor(rnd() * 2);
    for (let k = 0; k < kids; k++) {
      branch(cx, cy, a + (rnd() - 0.5) * 1.6, len * (0.55 + rnd() * 0.2), w * 0.62, depth - 1);
    }
  };
  branch(-20, 80, 0.15, 380, 40, 7);
  branch(-20, 320, -0.35, 300, 28, 6);
  branch(80, -20, 0.9, 260, 22, 6);
  return tex(c);
}

// Dark mossy ground
export function makeGroundTexture() {
  const [c, g] = canvas(512, 512);
  g.fillStyle = "#120c18";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4000; i++) {
    const v = Math.random();
    g.fillStyle = v > 0.5 ? "rgba(40,30,50,0.35)" : "rgba(5,3,8,0.4)";
    g.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 4, 2 + Math.random() * 4);
  }
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(20, 20);
  return t;
}
