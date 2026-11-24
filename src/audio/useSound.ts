import { useEffect, useState } from "react";
import { sound } from "./SoundEngine";

type Ambience = Parameters<typeof sound.setAmbience>[0];

export function useAmbience(a: Ambience) {
  useEffect(() => {
    sound.setAmbience(a);
    const unlock = () => sound.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [a]);
}

export function useMuted() {
  const [muted, setMuted] = useState(sound.muted);
  useEffect(() => sound.onMute(setMuted), []);
  return [muted, (m: boolean) => sound.setMuted(m)] as const;
}

export const uiSound = {
  onPointerEnter: () => sound.hover(),
  onPointerDown: () => { sound.unlock(); sound.click(); },
};
