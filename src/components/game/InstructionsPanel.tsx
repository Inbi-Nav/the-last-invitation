import { Divider, GothicPanel, PlateButton } from "../ui/Gothic";
import styles from "./InstructionsPanel.module.css";
import { useEffect } from "react";
export default function InstructionsPanel({
  onStart,
}: {
  onStart: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        event.preventDefault();
        onStart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onStart]);
  return (
    <div className={styles.backdrop} role="presentation">
      <GothicPanel className={styles.panel}>
        <div className={styles.inner}>
          <h2 className={styles.title}>The Last Invitation</h2>
          <Divider className={styles.divider} />
          <ul className={styles.list}>
            <li>
              <b>WASD / Arrows</b>
              <span>Move through the dark</span>
            </li>
            <li>
              <b>Mouse</b>
              <span>Look behind you… if you dare</span>
            </li>
            <li>
              <b>Shift</b>
              <span>Run — when it gets closer</span>
            </li>
            <li>
              <b>E</b>
              <span>Try the doors upstairs</span>
            </li>
            <li>
              <b>F</b>
              <span>Flashlight</span>
            </li>
            <li>
              <b>Esc</b>
              <span>Release cursor</span>
            </li>
          </ul>
          <Divider className={styles.divider} />
          <div className={styles.actions}>
            <PlateButton onClick={onStart}>start exploring</PlateButton>
          </div>{" "}
        </div>
      </GothicPanel>
    </div>
  );
}
