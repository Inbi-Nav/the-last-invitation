import { useState } from "react";
import StartScreen from "./components/StartScreen";

type Screen = "start" | "lobby";

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");

  if (screen === "lobby") {
    return (
      <main className="lobby-placeholder">
        <h1>The Last Invitation</h1>
        <p>Lobby — next phase</p>
        <button type="button" onClick={() => setScreen("start")}>
          Return to Start
        </button>
      </main>
    );
  }

  return <StartScreen onStart={() => setScreen("lobby")} />;
}