import { Divider, GothicPanel, PlateButton } from "../ui/Gothic";
import styles from "./InstructionsPanel.module.css";

export default function InstructionsPanel({
  onStart,
}: {
  onStart: () => void;
}) {
  return (
    <div className={styles.backdrop} role="presentation">
      <GothicPanel className={styles.panel}>
        <div className={styles.inner}>
          <h2 className={styles.title}>Explore the Mansion</h2>
          <Divider className={styles.divider} />
          <ul className={styles.list}>
            <li>
              <b>WASD / Arrows</b>
              <span>Walk</span>
            </li>
            <li>
              <b>Mouse</b>
              <span>Look around</span>
            </li>
            <li>
              <b>Shift</b>
              <span>Sprint</span>
            </li>
            <li>
              <b>Esc</b>
              <span>Release cursor</span>
            </li>
          </ul>
          <Divider className={styles.divider} />
          <p className={styles.hint}>
            Click the scene to take control of the camera.
          </p>
          <PlateButton onClick={onStart}>Start Exploring</PlateButton>
        </div>
      </GothicPanel>
    </div>
  );
}
