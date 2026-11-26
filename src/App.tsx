import { lazy, Suspense, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import StartScreen from "./components/start/StartScreen";
import { PlayerProvider } from "./state/PlayerContext";

const LobbyScreen = lazy(() => import("./components/lobby/LobbyScreen"));
const PlayerScreen = lazy(() => import("./components/player/PlayerScreen"));
const InventoryScreen = lazy(
  () => import("./components/inventory/InventoryScreen"),
);

type Screen = "start" | "lobby" | "player" | "inventory";

function initialScreen(): Screen {
  if (import.meta.env.DEV) {
    const s = new URLSearchParams(location.search).get("screen");
    if (s === "lobby" || s === "player" || s === "inventory") return s;
  }
  return "start";
}

function Loading() {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "#0d0716", display: "grid", placeItems: "center", color: "#d9b26a", letterSpacing: "0.25em", fontFamily: "Cinzel, Georgia, serif",}}>
      Loading…
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(initialScreen);

  useEffect(() => {
    const id = window.setTimeout(
      () => useGLTF.preload("/models/mansion-int.glb"),
      3000,
    );
    return () => window.clearTimeout(id);
  }, []);

  return (
    <PlayerProvider>
      {screen === "start" ? (
        <StartScreen onStart={() => setScreen("lobby")} />
      ) : (
        <Suspense fallback={<Loading />}>
          {screen === "lobby" && (
            <LobbyScreen
              onInventory={() => setScreen("inventory")}
              onPlayer={() => setScreen("player")}
              onStart={() => {}}
              onExit={() => setScreen("start")}
            />
          )}
          {screen === "player" && (
            <PlayerScreen onBack={() => setScreen("lobby")} />
          )}
          {screen === "inventory" && (
            <InventoryScreen onBack={() => setScreen("lobby")} />
          )}
        </Suspense>
      )}
    </PlayerProvider>
  );
}