export type CharacterId =   "oliver" | "sophie" ;
export type StatKey = "intelligence" | "observation" | "agility" | "courage" | "problemSolving";

export const STAT_LABELS: Record<StatKey, string> = {
  intelligence: "Intelligence",
  observation: "Observation",
  agility: "Agility",
  courage: "Courage",
  problemSolving: "Problem-Solving",
};

export const STAT_ORDER: StatKey[] = ["intelligence", "observation", "agility", "courage", "problemSolving"];
export interface Palette {
  skin: string;
  hair: string;
  coat: string;
  trim: string;
  pants: string;
  boots: string;
  gloves: string | null;
  belt: string;
  eyes: string;
  lips: string;
  goggles?: string;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  model: string;
  description: string;
  stats: Record<StatKey, number>;
  palette?: Palette;
}

export const CHARACTERS: CharacterDef[] = [
  
  {
    id: "oliver",
    name: "Oliver",
    model: "/characters/Oliver.glb",
    description:
      "A restless adventurer who has talked his way out of worse places than this. Quick on his feet and quicker with a grin, he runs toward the noise while others freeze.",
    stats: { intelligence: 64, observation: 68, agility: 92, courage: 80, problemSolving: 58 },
  },
  {
    id: "sophie",
    name: "Sophie",
    model: "/characters/Sophie.glb",
    description:
      "A composed and watchful guest who notices what others overlook: the draught under a door, the dust that has been disturbed, the portrait whose eyes have moved.",
    stats: { intelligence: 80, observation: 94, agility: 60, courage: 58, problemSolving: 76 },
  },

];

export const DEFAULT_CHARACTER: CharacterId = "oliver";

export const getCharacter = (id: CharacterId) => CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];