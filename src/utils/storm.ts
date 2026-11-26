export const STORM = {
  firstDelay: 6,
  minGap: 5,
  gapRange: 5,
  duration: 2.5,
  flashWindows: [
    [0, 0.15],
    [0.4, 0.65],
    [1.1, 1.35],
    [1.8, 2.15],
  ] as const,
  flashIntensity: 9,
  idleIntensity: 0.4,
};

export interface StormState {
  timer: number;
  nextStorm: number;
  flashing: boolean;
  strikeId: number;
  intensity: number;
}

export function createStorm(): StormState {
  return { timer: 0, nextStorm: STORM.firstDelay, flashing: false, strikeId: 0, intensity: 0 };
}

export function stepStorm(s: StormState, delta: number, onStrike?: () => void): number {
  s.nextStorm -= delta;
  if (s.nextStorm <= 0 && s.timer <= 0) {
    s.timer = STORM.duration;
    s.nextStorm = STORM.minGap + Math.random() * STORM.gapRange;
    s.strikeId++;
    onStrike?.();
  }

  let intensity = 0;
  let flashing = false;
  if (s.timer > 0) {
    s.timer = Math.max(0, s.timer - delta);
    const elapsed = STORM.duration - s.timer;
    flashing = STORM.flashWindows.some(([a, b]) => elapsed > a && elapsed < b);
    intensity = flashing ? STORM.flashIntensity : STORM.idleIntensity;
  }
  s.flashing = flashing;
  s.intensity = intensity;
  return intensity;
}