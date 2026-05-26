"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { playCassettePickup, playCassetteInsert, playCassetteStart } from "@/lib/sounds";

const TRACKS = [
  { src: "/music/Approaching_the_Far_Side.mp3", title: "APPROACHING THE FAR SIDE", cover: "/music/Approaching_the_Far_Side.jpg", color: "#ffd700", shell: "#3a2a1a", edge: "#281a0e" },
  { src: "/music/Through_The_Asteroid_Belt.mp3", title: "THROUGH THE ASTEROID BELT", cover: "/music/Through_The_Asteroid_Belt.jpg", color: "#ff4444", shell: "#3a1a1a", edge: "#280e0e" },
  { src: "/music/Above_The_Silver_Glass.mp3", title: "ABOVE THE SILVER GLASS", cover: "/music/Above_The_Silver_Glass.jpg", color: "#7dd3fc", shell: "#1a2a3a", edge: "#0e1a28" },
  { src: "/music/Midnight_Chrome_Run.mp3", title: "MIDNIGHT CHROME RUN", cover: null as string | null, color: "#ff00ff", shell: "#2e1a3a", edge: "#1e0e28" },
  { src: "/music/Neon_Sax_Parade.mp3", title: "NEON SAX PARADE", cover: null as string | null, color: "#00ff88", shell: "#1a3a2a", edge: "#0e281a" },
  { src: "/music/Moonwalk_Synth.mp3", title: "MOONWALK SYNTH", cover: null as string | null, color: "#00cfff", shell: "#1a2840", edge: "#0e1a2e" },
];

const PX = 5;

function fmt(s: number) {
  if (!s || !isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function CassetteIcon({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 28 20" width="28" height="20" className="shrink-0">
      <rect x="1" y="1" width="26" height="18" rx="2" fill="#12122a" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="3" width="20" height="7" rx="1" fill="currentColor" opacity="0.1" />
      <circle cx="10" cy="14" r="2.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7">
        {playing && <animateTransform attributeName="transform" type="rotate" from="0 10 14" to="360 10 14" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx="10" cy="14" r="0.7" fill="currentColor" opacity="0.5" />
      <circle cx="18" cy="14" r="2.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7">
        {playing && <animateTransform attributeName="transform" type="rotate" from="0 18 14" to="360 18 14" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx="18" cy="14" r="0.7" fill="currentColor" opacity="0.5" />
      <line x1="12.5" y1="14" x2="15.5" y2="14" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
    </svg>
  );
}

function pixelDepth(color: string, edgeColor: string, px: number) {
  const layers = [];
  for (let i = 1; i <= px; i++) {
    layers.push(`${i}px ${i}px 0 ${i <= px / 2 ? color : edgeColor}`);
  }
  return layers.join(", ");
}

function Reel3D({ spinning, size = 52 }: { spinning: boolean; size?: number }) {
  return (
    <div
      className="relative rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: "#0a0a16",
        border: "3px solid #1a1a30",
        boxShadow: "inset 0 3px 0 #060610, inset 0 -1px 0 #2a2a4a",
      }}
    >
      <div
        className={`absolute rounded-full ${spinning ? "animate-[spin_1.8s_linear_infinite]" : ""}`}
        style={{ width: size * 0.65, height: size * 0.65 }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 h-px"
            style={{
              width: size * 0.32,
              transformOrigin: "0 0",
              transform: `rotate(${60 * i}deg)`,
              background: "#2a2a4a",
            }}
          />
        ))}
      </div>
      <div
        className="relative z-10 rounded-full"
        style={{
          width: size * 0.24,
          height: size * 0.24,
          background: "#14142a",
          border: "2px solid #2a2a4a",
          boxShadow: "inset 0 1px 0 #060610",
        }}
      />
    </div>
  );
}

function CassetteLabel({ track }: { track: (typeof TRACKS)[number] }) {
  if (track.cover) {
    return <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />;
  }
  return (
    <div
      className="w-full h-full flex items-center justify-center p-2 relative overflow-hidden"
      style={{ background: `linear-gradient(145deg, ${track.color}15, #0a0a1a 50%, ${track.color}08)` }}
    >
      <span className="font-pixel text-[5px] md:text-[6px] leading-relaxed text-center" style={{ color: track.color }}>
        {track.title}
      </span>
    </div>
  );
}

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [inserting, setInserting] = useState<number | null>(null);

  const track = loaded !== null ? TRACKS[loaded] : null;

  const play = useCallback(() => {
    audioRef.current?.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const insertCassette = useCallback(
    (idx: number) => {
      if (inserting !== null) return;
      if (loaded === idx) {
        playing ? pause() : play();
        return;
      }
      playCassettePickup();
      setInserting(idx);
      setTimeout(() => playCassetteInsert(), 350);
      setTimeout(() => {
        setLoaded(idx);
        setInserting(null);
        playCassetteStart();
      }, 800);
    },
    [inserting, loaded, playing, pause, play],
  );

  const next = useCallback(() => {
    insertCassette(loaded !== null ? (loaded + 1) % TRACKS.length : 0);
  }, [loaded, insertCassette]);

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) { a.currentTime = 0; return; }
    insertCassette(loaded !== null ? (loaded - 1 + TRACKS.length) % TRACKS.length : TRACKS.length - 1);
  }, [loaded, insertCassette]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || loaded === null) return;
    a.src = TRACKS[loaded].src;
    a.load();
    a.play().then(() => setPlaying(true)).catch(() => {});
  }, [loaded]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.currentTime);
    const onDur = () => setDuration(a.duration);
    const onEnd = () => { setLoaded(loaded !== null ? (loaded + 1) % TRACKS.length : 0); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onDur);
    a.addEventListener("ended", onEnd);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onDur);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, [loaded]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <>
      <audio ref={audioRef} preload="metadata" />

      <button
        onClick={() => setOpen(true)}
        className={`w-9 h-9 border-2 flex items-center justify-center transition-all duration-300 ${
          playing
            ? "border-pixel-cyan text-pixel-cyan shadow-[0_0_10px_rgba(0,255,255,0.25)]"
            : "border-[#2a2a4a] text-gray-500 hover:border-pixel-cyan hover:text-pixel-cyan"
        }`}
        title="Mission Audio"
      >
        <CassetteIcon playing={playing} />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-3 md:p-6 md:items-center"
              >
                <div className="fixed inset-0 bg-black/88 backdrop-blur-md" onClick={() => setOpen(false)} />

                <motion.div
                  initial={{ scale: 0.88, y: 24 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.88, y: 24, opacity: 0 }}
                  transition={{ type: "spring", damping: 24, stiffness: 300 }}
                  className="relative z-10 w-full max-w-2xl my-4"
                >
                  {/* Close */}
                  <button
                    onClick={() => setOpen(false)}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-[#1a1a3a] border-2 border-[#3a3a5a] text-gray-400 hover:text-white hover:border-pixel-red flex items-center justify-center font-pixel-body text-lg z-20 transition-colors"
                    style={{ boxShadow: `${pixelDepth("#12122a", "#0a0a1a", 3)}` }}
                  >
                    ×
                  </button>

                  {/* ── Recorder ── */}
                  <div
                    className="relative overflow-visible"
                    style={{
                      background: "linear-gradient(180deg, #222246 0%, #1c1c3a 50%, #161630 100%)",
                      border: "3px solid #33335a",
                      borderBottom: "3px solid #1a1a30",
                      borderRight: "3px solid #1a1a30",
                      boxShadow: pixelDepth("#161630", "#0a0a1a", PX + 2),
                      transform: "perspective(900px) rotateX(4deg)",
                      transformOrigin: "center bottom",
                    }}
                  >
                    {/* Top highlight */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-[#2e2e5a]" />
                    <div className="absolute left-0 inset-y-0 w-[2px] bg-[#2a2a50]" />

                    {/* Brand */}
                    <div className="flex items-center justify-between px-5 pt-3 pb-2">
                      <p className="font-pixel text-[7px] text-gray-500 tracking-[0.25em]">MOONLANDER</p>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 ${playing ? "bg-pixel-green" : "bg-gray-700"}`}
                          style={playing ? { boxShadow: "0 0 6px #00ff41, 0 0 12px #00ff4140" } : {}}
                        />
                        <p className="font-pixel text-[6px] text-gray-600">{playing ? "PLAY" : "STOP"}</p>
                      </div>
                    </div>

                    {/* Tape window — recessed */}
                    <div
                      className="mx-4 mb-3 p-5 relative overflow-hidden"
                      style={{
                        background: "#060610",
                        border: "3px solid #0a0a1a",
                        borderTop: "3px solid #040408",
                        borderLeft: "3px solid #040408",
                        boxShadow: `inset 2px 2px 0 #020206, inset -1px -1px 0 #1a1a30`,
                      }}
                    >
                      <div className="flex items-center justify-center gap-5 md:gap-8">
                        <Reel3D spinning={playing} />
                        <div className="flex-1 max-w-[90px] flex flex-col gap-2 py-1">
                          {[1, 0.6, 1, 0.5, 0.8].map((o, i) => (
                            <div key={i} className="h-px" style={{ background: `rgba(139, 90, 43, ${o * 0.5})` }} />
                          ))}
                        </div>
                        <Reel3D spinning={playing} />
                      </div>

                      {track && (
                        <motion.div
                          key={loaded}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 0.7, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="mt-3 mx-auto w-40 h-10 overflow-hidden"
                          style={{ border: `2px solid ${track.color}30` }}
                        >
                          <CassetteLabel track={track} />
                        </motion.div>
                      )}

                      {!track && inserting === null && (
                        <p className="font-pixel text-[6px] text-gray-600 text-center mt-4 tracking-wider animate-pulse">INSERT TAPE</p>
                      )}

                      <AnimatePresence>
                        {inserting !== null && (
                          <motion.div
                            initial={{ y: 160, rotateX: -35, scale: 0.95, opacity: 0.95 }}
                            animate={{ y: 0, rotateX: 0, scale: 0.6, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
                            style={{ perspective: 800 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          >
                            <div
                              className="w-32 h-20 overflow-hidden"
                              style={{
                                background: TRACKS[inserting].shell,
                                border: `3px solid ${TRACKS[inserting].color}50`,
                                boxShadow: pixelDepth(TRACKS[inserting].edge, "#0a0a0a", 4),
                              }}
                            >
                              <div className="w-full h-12 overflow-hidden border-b-2 border-black/30">
                                <CassetteLabel track={TRACKS[inserting]} />
                              </div>
                              <div className="flex items-center justify-between px-6 py-1">
                                <div className="w-3 h-3 rounded-full border-2 border-gray-600 bg-[#0a0a16]" />
                                <div className="w-3 h-3 rounded-full border-2 border-gray-600 bg-[#0a0a16]" />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Now playing */}
                    <div className="px-5 mb-2">
                      <p className="font-pixel text-[7px] md:text-[8px] text-pixel-cyan text-center truncate h-4">
                        {track ? track.title : "SELECT A CASSETTE"}
                      </p>
                    </div>

                    {/* Progress bar — pixel style */}
                    <div className="px-5 mb-3">
                      <div
                        onClick={seek}
                        className="h-3.5 cursor-pointer group relative overflow-hidden"
                        style={{
                          background: "#060610",
                          border: "2px solid #0a0a1a",
                          borderTop: "2px solid #040408",
                          borderLeft: "2px solid #040408",
                          boxShadow: "inset 2px 2px 0 #020206, inset -1px -1px 0 #1a1a30",
                        }}
                      >
                        <div
                          className="h-full transition-[width] duration-150"
                          style={{
                            width: `${pct}%`,
                            background: track ? track.color : "#00ffff",
                            boxShadow: track ? `inset 0 -2px 0 ${track.color}60, 0 0 6px ${track.color}30` : undefined,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="font-pixel-body text-[11px] text-gray-500">{fmt(progress)}</span>
                        <span className="font-pixel-body text-[11px] text-gray-500">{fmt(duration)}</span>
                      </div>
                    </div>

                    {/* Transport buttons — pixel 3D */}
                    <div className="flex items-center justify-center gap-3 px-5 pb-5">
                      {([
                        { label: "⏮", action: prev, size: "w-11 h-11 text-base" },
                        { label: playing ? "⏸" : "▶", action: () => (playing ? pause() : play()), size: "w-14 h-14 text-xl" },
                        { label: "⏭", action: next, size: "w-11 h-11 text-base" },
                      ] as const).map((btn, i) => (
                        <motion.button
                          key={i}
                          onClick={btn.action}
                          disabled={loaded === null}
                          whileTap={{ y: PX - 1 }}
                          className={`${btn.size} flex items-center justify-center font-pixel-body transition-colors disabled:opacity-25 disabled:cursor-not-allowed ${
                            i === 1 && playing
                              ? "text-pixel-cyan"
                              : "text-gray-400 hover:text-pixel-cyan"
                          }`}
                          style={{
                            background: "linear-gradient(180deg, #2a2a50, #1e1e3a)",
                            border: "2px solid #3a3a5a",
                            borderBottom: "2px solid #1a1a30",
                            borderRight: "2px solid #1a1a30",
                            boxShadow: pixelDepth("#161630", "#0a0a1a", PX - 1),
                          }}
                        >
                          {btn.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* ── Tape collection ── */}
                  <p className="font-pixel text-[7px] text-gray-500 mt-6 mb-3 tracking-[0.15em]">TAPE COLLECTION</p>
                  <div
                    className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-3"
                    style={{ perspective: 800, transformStyle: "preserve-3d" }}
                  >
                    {TRACKS.map((t, i) => {
                      const isLoaded = loaded === i;
                      const isInserting = inserting === i;

                      return (
                        <motion.button
                          key={i}
                          onClick={() => insertCassette(i)}
                          whileHover={!isInserting ? { y: -10, rotateX: 2, scale: 1.06 } : undefined}
                          whileTap={!isInserting ? { y: 0, rotateX: 18, scale: 0.97 } : undefined}
                          animate={
                            isInserting
                              ? { y: -70, rotateX: 55, scale: 0.4, opacity: 0 }
                              : { y: 0, rotateX: 12, scale: 1, opacity: 1 }
                          }
                          transition={
                            isInserting
                              ? { duration: 0.7, ease: [0.4, 0, 0.2, 1] }
                              : { type: "spring", stiffness: 280, damping: 18 }
                          }
                          style={{ perspective: 600 }}
                          className="w-full"
                        >
                          <div
                            className="overflow-hidden relative transition-all duration-200"
                            style={{
                              background: isLoaded
                                ? `linear-gradient(180deg, ${t.shell}, ${t.edge})`
                                : `linear-gradient(180deg, ${t.shell}, ${t.edge})`,
                              border: `3px solid ${isLoaded ? t.color : t.color + "40"}`,
                              borderBottom: `3px solid ${isLoaded ? t.color + "80" : t.edge}`,
                              borderRight: `3px solid ${isLoaded ? t.color + "80" : t.edge}`,
                              boxShadow: isLoaded
                                ? `${pixelDepth(t.edge, "#0a0a0a", PX)}, 0 0 16px ${t.color}30`
                                : pixelDepth(t.edge, "#0a0a0a", PX),
                            }}
                          >
                            {/* Top highlight */}
                            <div className="absolute top-0 inset-x-0 h-[2px] z-10" style={{ background: `${t.color}18` }} />
                            <div className="absolute left-0 inset-y-0 w-[2px] z-10" style={{ background: `${t.color}10` }} />

                            {/* Corner screws */}
                            <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-black/30 z-10" />
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-black/30 z-10" />

                            {/* Cover art / label — recessed */}
                            <div
                              className="w-full h-14 md:h-[70px] overflow-hidden relative"
                              style={{
                                borderBottom: `2px solid ${t.edge}`,
                                boxShadow: "inset 2px 2px 0 rgba(0,0,0,0.3), inset -1px -1px 0 rgba(255,255,255,0.03)",
                              }}
                            >
                              <CassetteLabel track={t} />
                              {isLoaded && (
                                <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: `inset 0 0 20px ${t.color}25` }} />
                              )}
                            </div>

                            {/* Tape reels section */}
                            <div
                              className="flex items-center justify-between px-2.5 md:px-3.5 py-2 relative"
                              style={{
                                background: "#060610",
                                borderTop: "2px solid #040408",
                                boxShadow: "inset 1px 1px 0 #020206",
                              }}
                            >
                              {[0, 1].map((r) => (
                                <div
                                  key={r}
                                  className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center ${isLoaded ? "animate-[spin_2s_linear_infinite]" : ""}`}
                                  style={{
                                    borderColor: isLoaded ? t.color : "#2a2a4a",
                                    background: "#0a0a16",
                                  }}
                                >
                                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full" style={{ background: isLoaded ? t.color : "#2a2a4a" }} />
                                </div>
                              ))}
                              {/* Tape between reels */}
                              <div className="absolute inset-x-6 md:inset-x-7 top-1/2 -translate-y-1/2">
                                <div className="h-2 md:h-2.5 border border-[#1a1a30] bg-[#0a0a16] flex items-center justify-center overflow-hidden">
                                  <div className="w-full h-full" style={{
                                    backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(139,90,43,0.15) 2px, rgba(139,90,43,0.15) 3px)",
                                  }} />
                                </div>
                              </div>
                            </div>

                            {/* Title strip */}
                            <div className="px-1.5 py-1" style={{ borderTop: `1px solid ${t.color}15` }}>
                              <p className="font-pixel text-[4px] md:text-[5px] truncate text-center" style={{ color: isLoaded ? t.color : "#6b7280" }}>
                                {t.title}
                              </p>
                            </div>

                            {/* Bottom corner screws */}
                            <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-black/20" />
                            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-black/20" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
