export interface ItemDef {
  id: string;
  piece: number;
  name: string;
  kind: string;
  rarity: 1 | 2 | 3;
  description: string;
}

export const ITEMS: ItemDef[] = [
  { 
    id: "watch", 
    piece: 5, 
    name: "Pocket Watch", 
    kind: "Item", 
    rarity: 3, 
    description: "A finely crafted pocket watch of old design. Its hands still move with steady precision, as if time here has not forgotten." 
  },
  { 
    id: "key", 
    piece: 0, 
    name: "Ornate Key", 
    kind: "Key Item", 
    rarity: 2, 
    description: "A heavy iron key with a clover-shaped bow. Whatever door it was cut for has been waiting a very long time." 
  },
  { 
    id: "magnifier", 
    piece: 6, 
    name: "Magnifying Glass", 
    kind: "Tool", 
    rarity: 2, 
    description: "A glass in a tarnished brass rim. Fine scratches, faded ink and hidden marks surrender to it." 
  },
  { 
    id: "letter", 
    piece: 1, 
    name: "Sealed Letter", 
    kind: "Document", 
    rarity: 3, 
    description: "A cream envelope closed with crimson wax. Your name is written on it in an unfamiliar, patient hand." 
  },
  { 
    id: "medallion", 
    piece: 7, 
    name: "Fleur-de-lis Medallion", 
    kind: "Relic", 
    rarity: 3, 
    description: "An oval medallion stamped with the fleur-de-lis. It is cold to the touch and bears the mansion's crest." 
  },
  { 
    id: "gear", 
    piece: 2, 
    name: "Brass Gear", 
    kind: "Mechanism", 
    rarity: 1, 
    description: "A spoked brass cog, worn smooth at the teeth. It belongs to a machine hidden somewhere in these walls." 
  },
  { 
    id: "tome", 
    piece: 8, 
    name: "Leather Tome", 
    kind: "Document", 
    rarity: 2, 
    description: "A thick book bound in dark leather and embossed with a lily. Its pages smell of smoke and old secrets." 
  },
  { 
    id: "crank", 
    piece: 3, 
    name: "Crank Handle", 
    kind: "Tool", 
    rarity: 1, 
    description: "A bent iron handle with a wooden grip. Something in this house is meant to be wound." 
  },
  { 
    id: "vial", 
    piece: 9, 
    name: "Crimson Vial", 
    kind: "Curio", 
    rarity: 1, 
    description: "A corked glass bottle holding a dark red liquid. It is best not to wonder what it is." 
  },
  { 
    id: "spyglass", 
    piece: 4, 
    name: "Brass Spyglass", 
    kind: "Tool", 
    rarity: 2, 
    description: "A short telescope of tarnished brass. Through it, distant things look closer than they should." 
  },
];

export const GRID_SLOTS = 12;
export const ITEMS_MODEL = "/props/inventory-props.glb";
export const ITEMS_PIECE_COUNT = 10;