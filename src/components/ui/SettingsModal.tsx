import { useEffect } from "react";
import { sound, type Volumes } from "../../audio/SoundEngine";
import { uiSound, useMuted, useVolumes } from "../../audio/useSound";
import { Divider, GothicPanel, IconButton } from "./Gothic";
import { IconClose, IconSpeaker, IconSpeakerOff } from "./icons";
import styles from "./SettingsModal.module.css";

const ROWS: { key: keyof Volumes; label: string }[] = [
  { key: "master", label: "Master Volume" },
  { key: "music", label: "Music & Ambience" },
  { key: "sfx", label: "Sound Effects" },
];

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [volumes, setVolume] = useVolumes();
  const [muted, setMuted] = useMuted();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.backdrop} role="presentation" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <GothicPanel className={styles.dialog}>
        <div role="dialog" aria-modal="true" aria-label="Settings" className={styles.inner}>
          <h2 className={styles.title}>Settings</h2>
          <Divider className={styles.divider} />

          <button type="button" className={`${styles.mute} ${muted ? styles.muteOn : ""}`} aria-pressed={muted} {...uiSound} onClick={() => setMuted(!muted)}>

            {muted ? <IconSpeakerOff size={22} /> : <IconSpeaker size={22} />}
            <span>{muted ? "Sound muted" : "Sound on"}</span>
            <em>{muted ? "Unmute" : "Mute"}</em>
          </button>

          {ROWS.map(({ key, label }) => (
            <label key={key} className={styles.row}>
              <span className={styles.label}>
                {label}
                <b>{Math.round(volumes[key] * 100)}%</b>
              </span>
              <input type="range" min={0} max={100} value={Math.round(volumes[key] * 100)} disabled={muted} style={
                  { "--fill": `${volumes[key] * 100}%` } as React.CSSProperties
                }
                onChange={(e) => setVolume(key, Number(e.target.value) / 100)}
                onPointerUp={() => {
                  sound.unlock();
                  if (key !== "music") sound.click();
                }}
              />
            </label>
          ))}
        </div>
        <IconButton label="Close settings" className={styles.close} onClick={onClose}>
          <IconClose />
        </IconButton>
      </GothicPanel>
    </div>
  );
}