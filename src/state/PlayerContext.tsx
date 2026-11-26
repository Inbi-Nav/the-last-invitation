import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CHARACTERS,
  DEFAULT_CHARACTER,
  type CharacterDef,
  type CharacterId,
  getCharacter,
} from "../data/characters";

const KEY = "tli-player";

function load(): CharacterId {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw && CHARACTERS.some((c) => c.id === raw)) return raw as CharacterId;
  } catch {}
  return DEFAULT_CHARACTER;
}

interface PlayerCtx {
  selectedId: CharacterId;
  selected: CharacterDef;
  select: (id: CharacterId) => void;
}

const Ctx = createContext<PlayerCtx | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<CharacterId>(load);

  const select = useCallback((id: CharacterId) => {
    setSelectedId(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ selectedId, selected: getCharacter(selectedId), select }),
    [selectedId, select],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return v;
}