import { useMuted, uiSound } from "../../audio/useSound";
import styles from "./SoundToggle.module.css";

export default function SoundToggle({
  className = "",
}: {
  className?: string;
}) {
  const [muted, setMuted] = useMuted();
  return (
    <button type="button" className={`${styles.toggle} ${className}`} aria-label={muted ? "Turn sound on" : "Turn sound off"} title={muted ? "Sound off" : "Sound on"} {...uiSound} onClick={() => setMuted(!muted)}>
      
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"strokeLinejoin="round" aria-hidden="true">

        <path d="M4 9h4l5-4v14l-5-4H4z" />
        {muted ? (
          <path d="M17 9l5 6M22 9l-5 6" />
        ) : (
          <>
            <path d="M16.5 8.5a5 5 0 0 1 0 7" />
            <path d="M19 6a8.5 8.5 0 0 1 0 12" />
          </>
        )}
      </svg>
    </button>
  );
}
