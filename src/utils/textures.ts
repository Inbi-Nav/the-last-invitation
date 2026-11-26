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

// Dark polished stone slab with soft marbling, used for interior floors
export function makeStoneTexture(seed = 7) {
  const [c, g] = canvas(512, 512);
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  g.fillStyle = "#241019";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 200; i++) {
    const x = rnd() * 512;
    const y = rnd() * 512;
    const r = 20 + rnd() * 90;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    const light = rnd() > 0.5;
    grd.addColorStop(0, light ? "rgba(120,84,96,0.10)" : "rgba(8,3,7,0.16)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // veins
  g.strokeStyle = "rgba(196,168,140,0.07)";
  for (let v = 0; v < 14; v++) {
    g.beginPath();
    let x = rnd() * 512;
    let y = rnd() * 512;
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (rnd() - 0.5) * 150;
      y += (rnd() - 0.5) * 150;
      g.lineTo(x, y);
    }
    g.lineWidth = 0.6 + rnd() * 1.4;
    g.stroke();
  }
  // slab joints
  g.strokeStyle = "rgba(0,0,0,0.45)";
  g.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    g.beginPath();
    g.moveTo((512 / 4) * i, 0);
    g.lineTo((512 / 4) * i, 512);
    g.stroke();
    g.beginPath();
    g.moveTo(0, (512 / 4) * i);
    g.lineTo(512, (512 / 4) * i);
    g.stroke();
  }
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
}

/**
 * Burgundy stair carpet with an antique-gold border, laid down the middle of the
 * hall. Canvas-generated so the look ships without an extra asset.
 */
export function makeCarpetTexture() {
  const [c, g] = canvas(1024, 1024);
  const base = g.createLinearGradient(0, 0, 1024, 0);
  base.addColorStop(0, "#3d0a16");
  base.addColorStop(0.5, "#5a1020");
  base.addColorStop(1, "#3d0a16");
  g.fillStyle = base;
  g.fillRect(0, 0, 1024, 1024);

  // woven noise
  let s = 11;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 9000; i++) {
    const x = rnd() * 1024;
    const y = rnd() * 1024;
    g.fillStyle = rnd() > 0.5 ? "rgba(120,30,45,0.25)" : "rgba(24,4,10,0.30)";
    g.fillRect(x, y, 2, 2);
  }

  // gold border, double rule
  g.strokeStyle = "#c9a45c";
  g.lineWidth = 14;
  g.strokeRect(34, 34, 1024 - 68, 1024 - 68);
  g.strokeStyle = "#8d6c33";
  g.lineWidth = 5;
  g.strokeRect(64, 64, 1024 - 128, 1024 - 128);

  // corner scrolls
  g.fillStyle = "#c9a45c";
  for (const [cx, cy, sx, sy] of [[70, 70, 1, 1], [954, 70, -1, 1], [70, 954, 1, -1], [954, 954, -1, -1]]) {
    g.beginPath();
    g.arc(cx + sx * 46, cy + sy * 46, 30, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#5a1020";
    g.beginPath();
    g.arc(cx + sx * 46, cy + sy * 46, 17, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#c9a45c";
  }

  const t = tex(c);
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}