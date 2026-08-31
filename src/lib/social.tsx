import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { api } from "./api";
import type { Source } from "./types";

// State sosial (jumlah heart + apakah user ini sudah react/save) untuk banyak resep.
// Di-batch: kartu/detail memanggil ensure() dgn daftar resep terlihat -> 1 request/halaman.
// Jumlah selalu dari server (tak bisa dicurangi); toggle optimistik lalu direkonsiliasi.

type Key = string;
const mk = (source: Source, id: string): Key => `${source}:${id}`;

interface SocialCtx {
  count: (source: Source, id: string) => number;
  reacted: (source: Source, id: string) => boolean;
  saved: (source: Source, id: string) => boolean;
  ensure: (items: { source: Source; id: string }[]) => void;
  toggleReact: (source: Source, id: string) => Promise<void>;
  toggleSave: (source: Source, id: string) => Promise<void>;
}

const Ctx = createContext<SocialCtx | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<Record<Key, number>>({});
  const [reactedMap, setReacted] = useState<Record<Key, boolean>>({});
  const [savedMap, setSaved] = useState<Record<Key, boolean>>({});
  const loadedRef = useRef<Set<Key>>(new Set()); // sudah / sedang diambil

  const ensure = useCallback((items: { source: Source; id: string }[]) => {
    const need: Key[] = [];
    for (const it of items) {
      const k = mk(it.source, it.id);
      if (!loadedRef.current.has(k)) {
        loadedRef.current.add(k);
        need.push(k);
      }
    }
    if (!need.length) return;
    // Batasi panjang URL: pecah jadi batch ~80 kunci per request.
    const CHUNK = 80;
    for (let i = 0; i < need.length; i += CHUNK) {
      const batch = need.slice(i, i + CHUNK);
      api
        .social(batch)
        .then((res) => {
          setCounts((c) => {
            const next = { ...c };
            for (const k of batch) if (next[k] == null) next[k] = 0; // default 0 (belum ada heart)
            for (const k in res.counts) next[k] = res.counts[k];
            return next;
          });
          if (res.reacted.length)
            setReacted((m) => {
              const n = { ...m };
              res.reacted.forEach((k) => (n[k] = true));
              return n;
            });
          if (res.saved.length)
            setSaved((m) => {
              const n = { ...m };
              res.saved.forEach((k) => (n[k] = true));
              return n;
            });
        })
        .catch(() => {
          batch.forEach((k) => loadedRef.current.delete(k)); // biar bisa dicoba lagi
        });
    }
  }, []);

  const count = useCallback((s: Source, id: string) => counts[mk(s, id)] ?? 0, [counts]);
  const reacted = useCallback((s: Source, id: string) => !!reactedMap[mk(s, id)], [reactedMap]);
  const saved = useCallback((s: Source, id: string) => !!savedMap[mk(s, id)], [savedMap]);

  const toggleReact = useCallback(
    async (s: Source, id: string) => {
      const k = mk(s, id);
      const was = !!reactedMap[k];
      setReacted((m) => ({ ...m, [k]: !was }));
      setCounts((c) => ({ ...c, [k]: Math.max(0, (c[k] ?? 0) + (was ? -1 : 1)) }));
      try {
        const r = await api.react(s, id);
        setReacted((m) => ({ ...m, [k]: r.reacted }));
        setCounts((c) => ({ ...c, [k]: r.count }));
        loadedRef.current.add(k);
      } catch (e) {
        setReacted((m) => ({ ...m, [k]: was }));
        setCounts((c) => ({ ...c, [k]: Math.max(0, (c[k] ?? 0) + (was ? 1 : -1)) }));
        throw e;
      }
    },
    [reactedMap]
  );

  const toggleSave = useCallback(
    async (s: Source, id: string) => {
      const k = mk(s, id);
      const was = !!savedMap[k];
      setSaved((m) => ({ ...m, [k]: !was }));
      try {
        const r = await api.save(s, id);
        setSaved((m) => ({ ...m, [k]: r.saved }));
      } catch (e) {
        setSaved((m) => ({ ...m, [k]: was }));
        throw e;
      }
    },
    [savedMap]
  );

  return (
    <Ctx.Provider value={{ count, reacted, saved, ensure, toggleReact, toggleSave }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSocial(): SocialCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSocial harus dipakai di dalam SocialProvider");
  return c;
}
