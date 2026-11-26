import { useEffect } from "react";
import { sound, type Volumes } from "../../audio/SoundEngine";
import { uiSound, useMuted, useVolumes } from "../../audio/useSound";
import { Divider, GothicPanel, IconButton } from "../ui/Gothic";
import { IconClose, IconExit, IconSpeaker, IconSpeakerOff } from "../ui/icons";
import styles from "./GameSettingsMenu.module.css";

const ROWS: { key: keyof Volumes; label: string }[] = [
  { key: "master", label: "Master Volume" },
  { key: "music", label: "Music & Ambience" },
  { key: "sfx", label: "Sound Effects" },
];

interface Props {
  onClose: () => void;
  onShowControls: () => void;
  onExit: () => void;
}

export default function GameSettingsMenu({
  onClose,
  onShowControls,
  onExit,
}: Props) {
  const [volumes, setVolume] = useVolumes();
  const [muted, setMuted] = useMuted();

  useEffect(() => {
    document.exitPointerLock?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.backdrop} role="presentation" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <GothicPanel className={styles.dialog}>
        <div role="dialog" aria-modal="true" aria-label="Game settings" className={styles.inner}>
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
                onChange={(e) => setVolume(key, Number(e.target.value) / 100)} onPointerUp={() => { sound.unlock();

                  if (key !== "music") sound.click();
                }}
              />
            </label>
          ))}

          <Divider className={styles.divider} />

          <button type="button" className={styles.menuBtn} {...uiSound} onClick={onShowControls}>
            <span>Controls</span>
          </button>

          <button type="button" className={styles.menuBtn} {...uiSound} onClick={onExit}>
            <span className={styles.exitRow}>
              <IconExit size={18} />
              Exit to Lobby
            </span>
          </button>
        </div>

        <IconButton label="Close settings" className={styles.close} onClick={onClose}>
          <IconClose />
        </IconButton>
      </GothicPanel>
    </div>
  );
}
