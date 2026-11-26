import { Divider, GothicPanel, PlateButton } from "../ui/Gothic";
import styles from "./InstructionsPanel.module.css";

export default function InstructionsPanel({
  mode = "start",
  onDismiss,
}: {
  mode?: "start" | "back";
  onDismiss: () => void;
}) {
  return (
    <div className={styles.backdrop} role="presentation">
      <GothicPanel className={styles.panel}>
        <div className={styles.inner}>
          <h2 className={styles.title}>Explore the Mansion</h2>
          <Divider className={styles.divider} />
          <ul className={styles.list}>
            <li><b>W A S D</b><span>Walk · climb and descend stairs</span></li>
            <li><b>Mouse</b><span>Look around</span></li>
            <li><b>Shift</b><span>Sprint</span></li>
            <li><b>C</b><span>Crouch (hold)</span></li>
            <li><b>Esc</b><span>Release cursor</span></li>
          </ul>
          <Divider className={styles.divider} />
          {mode === "start" && (
            <p className={styles.hint}>
              Click the scene to take control of the camera.
            </p>
          )}
          <PlateButton onClick={onDismiss}>
            {mode === "start" ? "Start Exploring" : "Back"}
          </PlateButton>
        </div>
      </GothicPanel>
    </div>
  );
}
