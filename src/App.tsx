import { useState } from "react";
import StartScreen from "./components/start/StartScreen";

export default function App() {
  const [screen, setScreen] = useState<"start" | "lobby">("start");

  // Lobby not implemented yet
  if (screen === "lobby") return <div style={{ position: "fixed", inset: 0, background: "#000" }} />;

  return <StartScreen onStart={() => setScreen("lobby")} />;
}
