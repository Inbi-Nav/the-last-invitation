import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { GRID_SLOTS, ITEMS } from "../../data/items";
import { useAmbience } from "../../audio/useSound";
import GhostLayer from "../lobby/GhostLayer";
import HallBackdrop from "../scene/HallBackdrop";
import { type CamCfg } from "../scene/placement";
import { Divider, Gem, GothicPanel, IconButton } from "../ui/Gothic";
import { IconBack, IconBan, IconBriefcase, IconGear } from "../ui/icons";
import SettingsModal from "../ui/SettingsModal";
import ItemPreview from "./ItemPreview";
import { renderThumbnails, useItemPieces } from "./itemPieces";
import styles from "./InventoryScreen.module.css";

const INVENTORY_CAM: CamCfg = {
  pos: [0.02, 0.2, 0.75],
  look: [-0.5, 0.27, 0],
  fov: 55,
};

function Slots({
  thumbs,
  selected,
  onSelect,
}: {
  thumbs: string[] | null;
  selected: number;
  onSelect: (i: number) => void;
}) {
  return (
    <ul className={styles.grid} role="listbox" aria-label="Items">
      {Array.from({ length: GRID_SLOTS }, (_, i) => {
        const item = ITEMS[i];
        if (!item)
          return (
            <li
              key={i}
              className={`${styles.slot} ${styles.empty}`}
              aria-hidden
            />
          );
        const on = i === selected;
        return (
          <li key={item.id}>
            <button type="button" role="option" aria-selected={on} aria-label={item.name} title={item.name} className={`${styles.slot} ${on ? styles.on : ""}`} onClick={() => onSelect(i)}>
              {thumbs ? (
                <img src={thumbs[item.piece]} alt="" draggable={false} />
              ) : (
                <span className={styles.shimmer} />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Items() {
  const pieces = useItemPieces();
  const [selected, setSelected] = useState(0);
  const [thumbs, setThumbs] = useState<string[] | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setThumbs(renderThumbnails(pieces)), 50);
    return () => window.clearTimeout(id);
  }, [pieces]);

  const item = ITEMS[selected];
  const piece = pieces[item.piece];

  return (
    <>
      <GothicPanel className={styles.grid_panel}>
        <div className={styles.tab}>
          <IconBriefcase size={22}/>
          <span>Items</span>
        </div>
        <Slots thumbs={thumbs} selected={selected} onSelect={setSelected} />
      </GothicPanel>

      <GothicPanel className={styles.details}>
        <h2 className={styles.itemName}>{item.name}</h2>
        <div className={styles.kind}>
          <i/>
          <span>{item.kind}</span>
          <i/>
        </div>
        <div className={styles.preview}>
          <ItemPreview piece={piece}/>
        </div>

        <div className={styles.rarity} aria-label={`Rarity ${item.rarity} of 3`}>
          {[1, 2, 3].map((n) => (
            <Gem key={n} size={9} className={n <= item.rarity ? "" : styles.dim}/>
          ))}
        </div>

        <Divider className={styles.rule}/>
        <p className={styles.desc}>{item.description}</p>

        <button type="button" className={styles.useBtn} disabled aria-disabled="true">
          <IconBan size={22}/>
          <span>Select Item</span>
        </button>
      </GothicPanel>
    </>
  );
}

export default function InventoryScreen({ onBack }: { onBack: () => void }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(false);
  useAmbience("lobby");
  const cam = useMemo(() => INVENTORY_CAM, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && !settings && onBack();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack, settings]);

  return (
    <div className={`${styles.screen} ${ready ? styles.ready : ""}`}>
      <Canvas className={styles.canvas} dpr={[1, 1.5]} camera={{ position: cam.pos, fov: cam.fov, near: 0.01, far: 50 }} gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.35,
        }}
        onCreated={() => setReady(true)}>

        <Suspense fallback={null}>
          <HallBackdrop cam={cam}>
            <GhostLayer cam={cam} mode="inventory" />
          </HallBackdrop>
        </Suspense>
      </Canvas>

      <div className={styles.grade} />
      <div className={styles.vignette} />

      <header className={styles.top}>

        <IconButton label="Back to lobby" onClick={onBack} className={styles.back}>
          <IconBack/>

        </IconButton>
        <h1 className={styles.heading}>
          <span className={styles.game}>The Last Invitation</span>
          <Divider className={styles.hLine} />
          <span className={styles.sub}>◆&nbsp; Inventory &nbsp;◆</span>
        </h1>

        <IconButton label="Settings" onClick={() => setSettings(true)} className= {styles.gear}>
          <IconGear/>

        </IconButton>
      </header>

      <Suspense fallback={<div className={styles.loading}>Opening the trunk…</div>}>
        <Items/>
      </Suspense>

      {settings && <SettingsModal onClose={() => setSettings(false)} />}
    </div>
  );
}
