export interface RoomDef {
  id: string;
  name: string;
  model: string;
  hint: string;
}

export const ROOMS: RoomDef[] = [
  {
    id: "study",
    name: "The Study",
    model: "/models/haunted-arcade.glb",
    hint: "Explore the room. Move with WASD or the arrow keys.",
  },
];