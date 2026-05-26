"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { playCassettePickup, playCassetteInsert, playCassetteStart } from "@/lib/sounds";

const TRACKS = [
  { src: "/music/Final_Approach.mp3", title: "FINAL APPROACH", cover: null as string | null, color: "#00ffff" },
  { src: "/music/Crossing_the_Far_Perimeter.mp3", title: "CROSSING THE FAR PERIMETER", cover: null as string | null, color: "#b967ff" },
  { src: "/music/Approaching_the_Far_Side.mp3", title: "APPROACHING THE FAR SIDE", cover: "/music/Approaching_the_Far_Side.jpg", color: "#ffd700" },
  { src: "/music/Through_The_Asteroid_Belt.mp3", title: "THROUGH THE ASTEROID BELT", cover: "/music/Through_The_Asteroid_Belt.jpg", color: "#ff4444" },
  { src: "/music/Above_The_Silver_Glass.mp3", title: "ABOVE THE SILVER GLASS", cover: "/music/Above_The_Silver_Glass.jpg", color: "#7dd3fc" },
];

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

function Reel3D({ spinning, size = 56 }: { spinning: boolean; size?: number }) {
  const spokeCount = 6;
  const inner = size * 0.35;

  return (
    <div
      className="relative rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 40% 35%, #22223a 0%, #14142a 50%, #0a0a1a 100%)",
        boxShadow: "inset 0 3px 8px rgba(0,0,0,0.9), inset 0 -1px 3px rgba(255,255,255,0.03), 0 2px 4px rgba(0,0,0,0.4)",
      }}
    >
      {/* Outer ring groove */}
      <div
        className="absolute rounded-full"
        style={{
          inset: 3,
          border: "1px solid rgba(255,255,255,0.04)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)",
        }}
      />
      {/* Spokes */}
      <div
        className={`absolute rounded-full ${spinning ? "animate-[spin_1.8s_linear_infinite]" : ""}`}
        style={{ width: inner * 2, height: inner * 2 }}
      >
        {Array.from({ length: spokeCount }).map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 h-px"
            style={{
              width: inner,
              transformOrigin: "0 0",
              transform: `rotate(${(360 / spokeCount) * i}deg)`,
              background: "linear-gradient(90deg, rgba(100,100,140,0.6), rgba(100,100,140,0.1))",
            }}
          />
        ))}
      </div>
      {/* Center hub */}
      <div
        className="relative z-10 rounded-full"
        style={{
          width: size * 0.22,
          height: size * 0.22,
          background: "radial-gradient(circle at 40% 35%, #3a3a5a, #1a1a2e 60%, #0a0a1a)",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05)",
          border: "1px solid #2a2a4a",
        }}
      />
      {/* Mid ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: inner * 1.5,
          height: inner * 1.5,
          border: "1px solid rgba(100,100,140,0.15)",
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
      className="w-full h-full flex items-center justify-center p-3 relative overflow-hidden"
      style={{ background: `linear-gradient(145deg, ${track.color}12, #0a0a1a 50%, ${track.color}08)` }}
    >
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 3px)" }}
      />
      <span className="font-pixel text-[6px] md:text-[7px] leading-relaxed text-center relative z-10" style={{ color: track.color }}>
        {track.title}
      </span>
    </div>
  );
}

const DEPTH_SHADOW = "0 1px 0 #1c1c3a, 0 2px 0 #181830, 0 3px 0 #141428, 0 4px 0 #101020, 0 5px 0 #0c0c18, 0 6px 0 #0a0a14, 0 14px 28px rgba(0,0,0,0.6)";
const DEPTH_SHADOW_ACTIVE = (c: string) =>
  `0 1px 0 #1c1c3a, 0 2px 0 #181830, 0 3px 0 #141428, 0 4px 0 #101020, 0 5px 0 #0c0c18, 0 6px 0 #0a0a14, 0 14px 28px rgba(0,0,0,0.6), 0 0 20px ${c}20`;

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
    const i = loaded !== null ? (loaded + 1) % TRACKS.length : 0;
    insertCassette(i);
  }, [loaded, insertCassette]);

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    const i = loaded !== null ? (loaded - 1 + TRACKS.length) % TRACKS.length : TRACKS.length - 1;
    insertCassette(i);
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
    const onEnd = () => {
      const i = loaded !== null ? (loaded + 1) % TRACKS.length : 0;
      setLoaded(i);
    };
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

      {/* Header trigger */}
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

      {/* Modal — portaled to body */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-3 md:p-6 md:items-center"
              >
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setOpen(false)} />

                <motion.div
                  initial={{ scale: 0.85, y: 30, rotateX: 10 }}
                  animate={{ scale: 1, y: 0, rotateX: 0 }}
                  exit={{ scale: 0.85, y: 30, opacity: 0 }}
                  transition={{ type: "spring", damping: 22, stiffness: 280 }}
                  className="relative z-10 w-full max-w-2xl my-4"
                  style={{ perspective: 1200 }}
                >
                  {/* Close */}
                  <button
                    onClick={() => setOpen(false)}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-[#1a1a3a] border-2 border-[#2a2a4a] text-gray-400 hover:text-white hover:border-pixel-red flex items-center justify-center font-pixel-body text-lg z-20 transition-colors"
                    style={{ boxShadow: "0 4px 8px rgba(0,0,0,0.5)" }}
                  >
                    ×
                  </button>

                  {/* ── 3D Recorder body ── */}
                  <div
                    className="relative overflow-hidden"
                    style={{
                      background: "linear-gradient(180deg, #222244 0%, #1a1a36 8%, #14142a 40%, #10102a 100%)",
                      border: "2px solid #33335a",
                      borderBottom: "2px solid #1a1a30",
                      boxShadow: `
                        0 1px 0 rgba(255,255,255,0.06) inset,
                        0 -1px 0 #0a0a1a inset,
                        0 2px 0 #1a1a30,
                        0 4px 0 #14142a,
                        0 6px 0 #0e0e20,
                        0 24px 60px rgba(0,0,0,0.7)
                      `,
                    }}
                  >
                    {/* Top highlight bevel */}
                    <div
                      className="absolute top-0 inset-x-0 h-px"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent)" }}
                    />

                    {/* Brand label */}
                    <div className="flex items-center justify-between px-5 pt-3 pb-2">
                      <p className="font-pixel text-[7px] text-gray-500 tracking-[0.25em]">MOONLANDER</p>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${playing ? "bg-pixel-green" : "bg-gray-700"}`}
                          style={playing ? { boxShadow: "0 0 6px #00ff41, 0 0 12px #00ff4140" } : {}}
                        />
                        <p className="font-pixel text-[6px] text-gray-600">{playing ? "PLAY" : "STOP"}</p>
                      </div>
                    </div>

                    {/* 3D Tape window */}
                    <div
                      className="mx-4 mb-3 p-5 relative overflow-hidden"
                      style={{
                        background: "linear-gradient(180deg, #060610 0%, #0a0a1a 30%, #0c0c1e 100%)",
                        border: "2px solid #1a1a30",
                        boxShadow: `
                          inset 0 6px 20px rgba(0,0,0,0.95),
                          inset 0 -2px 8px rgba(0,0,0,0.5),
                          inset 2px 0 8px rgba(0,0,0,0.4),
                          inset -2px 0 8px rgba(0,0,0,0.4),
                          0 1px 0 rgba(255,255,255,0.04)
                        `,
                      }}
                    >
                      <div className="flex items-center justify-center gap-6 md:gap-10">
                        <Reel3D spinning={playing} size={56} />
                        <div className="flex-1 max-w-[90px] flex flex-col gap-1.5 py-1">
                          {[0.5, 0.35, 0.5, 0.3, 0.45].map((o, i) => (
                            <div key={i} className="h-px rounded" style={{ backgroundColor: `rgba(139, 90, 43, ${o})` }} />
                          ))}
                        </div>
                        <Reel3D spinning={playing} size={56} />
                      </div>

                      {track && (
                        <motion.div
                          key={loaded}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 0.65, y: 0 }}
                          transition={{ delay: 0.15, duration: 0.4 }}
                          className="mt-3 mx-auto w-40 h-10 overflow-hidden"
                          style={{
                            border: `1px solid ${track.color}30`,
                            boxShadow: `inset 0 1px 4px rgba(0,0,0,0.6), 0 0 8px ${track.color}10`,
                          }}
                        >
                          <CassetteLabel track={track} />
                        </motion.div>
                      )}

                      {!track && inserting === null && (
                        <p className="font-pixel text-[6px] text-gray-600 text-center mt-4 tracking-wider animate-pulse">
                          INSERT TAPE
                        </p>
                      )}

                      {/* Insertion animation */}
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
                                border: `2px solid ${TRACKS[inserting].color}70`,
                                background: "linear-gradient(180deg, #1a1a3a, #10102a)",
                                boxShadow: `0 0 24px ${TRACKS[inserting].color}30, ${DEPTH_SHADOW}`,
                              }}
                            >
                              <div className="w-full h-12 overflow-hidden border-b border-[#2a2a4a]">
                                <CassetteLabel track={TRACKS[inserting]} />
                              </div>
                              <div className="flex items-center justify-between px-6 py-1.5">
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-500 flex items-center justify-center">
                                  <div className="w-1 h-1 rounded-full bg-gray-600" />
                                </div>
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-500 flex items-center justify-center">
                                  <div className="w-1 h-1 rounded-full bg-gray-600" />
                                </div>
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

                    {/* Progress bar */}
                    <div className="px-5 mb-3">
                      <div
                        onClick={seek}
                        className="h-3 cursor-pointer group relative overflow-hidden"
                        style={{
                          background: "#08081a",
                          border: "1px solid #1a1a30",
                          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.03)",
                        }}
                      >
                        <motion.div
                          className="h-full relative"
                          style={{
                            width: `${pct}%`,
                            background: track
                              ? `linear-gradient(90deg, ${track.color}80, ${track.color})`
                              : "#00ffff",
                            boxShadow: track ? `0 0 10px ${track.color}50` : undefined,
                          }}
                          transition={{ duration: 0.1 }}
                        >
                          <div className="absolute right-0 top-0 w-px h-full bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="font-pixel-body text-[11px] text-gray-500">{fmt(progress)}</span>
                        <span className="font-pixel-body text-[11px] text-gray-500">{fmt(duration)}</span>
                      </div>
                    </div>

                    {/* 3D Transport controls */}
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
                          whileTap={{ y: 3 }}
                          className={`${btn.size} border-2 flex items-center justify-center font-pixel-body transition-colors disabled:opacity-25 disabled:cursor-not-allowed ${
                            i === 1 && playing
                              ? "border-pixel-cyan text-pixel-cyan"
                              : "border-[#3a3a5a] text-gray-400 hover:border-pixel-cyan hover:text-pixel-cyan"
                          }`}
                          style={{
                            background: "linear-gradient(180deg, #222244 0%, #1a1a36 40%, #14142a 100%)",
                            boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset, 0 2px 0 #12122a, 0 3px 0 #0e0e20, 0 4px 0 #0a0a18, 0 6px 14px rgba(0,0,0,0.5)",
                          }}
                        >
                          {btn.label}
                        </motion.button>
                      ))}
                    </div>

                    {/* Bottom edge bevel */}
                    <div
                      className="absolute bottom-0 inset-x-0 h-px"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.3) 70%, transparent)" }}
                    />
                  </div>

                  {/* ── 3D Tape collection ── */}
                  <p className="font-pixel text-[7px] text-gray-500 mt-6 mb-3 tracking-[0.15em]">
                    TAPE COLLECTION
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {TRACKS.map((t, i) => {
                      const isLoaded = loaded === i;
                      const isInserting = inserting === i;

                      return (
                        <motion.button
                          key={i}
                          onClick={() => insertCassette(i)}
                          whileHover={!isInserting ? { y: -8, rotateX: -5, rotateY: 4, scale: 1.03 } : undefined}
                          whileTap={!isInserting ? { scale: 0.95, y: 0 } : undefined}
                          animate={
                            isInserting
                              ? { y: -70, rotateX: 45, scale: 0.4, opacity: 0 }
                              : { y: 0, rotateX: 6, rotateY: 0, scale: 1, opacity: 1 }
                          }
                          transition={
                            isInserting
                              ? { duration: 0.7, ease: [0.4, 0, 0.2, 1] }
                              : { type: "spring", stiffness: 260, damping: 18 }
                          }
                          style={{ perspective: 600, transformStyle: "preserve-3d" }}
                          className="w-full"
                        >
                          <div
                            className="overflow-hidden transition-shadow duration-300 relative"
                            style={{
                              background: "linear-gradient(180deg, #1e1e40 0%, #18183a 30%, #10102a 100%)",
                              border: `2px solid ${isLoaded ? t.color : "#2a2a4a"}`,
                              borderBottom: `2px solid ${isLoaded ? t.color + "80" : "#1a1a30"}`,
                              boxShadow: isLoaded ? DEPTH_SHADOW_ACTIVE(t.color) : DEPTH_SHADOW,
                            }}
                          >
                            {/* Top highlight */}
                            <div
                              className="absolute top-0 inset-x-0 h-px z-10"
                              style={{
                                background: isLoaded
                                  ? `linear-gradient(90deg, transparent, ${t.color}30, transparent)`
                                  : "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
                              }}
                            />

                            {/* Cover art label */}
                            <div
                              className="w-full h-16 md:h-20 border-b overflow-hidden relative"
                              style={{
                                borderColor: isLoaded ? `${t.color}30` : "#2a2a4a",
                                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5), inset 0 -2px 6px rgba(0,0,0,0.3)",
                              }}
                            >
                              <CassetteLabel track={t} />
                              {isLoaded && (
                                <div
                                  className="absolute inset-0 pointer-events-none"
                                  style={{ boxShadow: `inset 0 0 24px ${t.color}20` }}
                                />
                              )}
                            </div>

                            {/* Tape reels */}
                            <div
                              className="flex items-center justify-between px-3 md:px-4 py-2 relative"
                              style={{
                                background: "linear-gradient(180deg, #0c0c20 0%, #08081a 100%)",
                                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.4)",
                              }}
                            >
                              {[0, 1].map((r) => (
                                <div
                                  key={r}
                                  className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center ${isLoaded ? "animate-[spin_2s_linear_infinite]" : ""}`}
                                  style={{
                                    borderColor: isLoaded ? t.color : "#3a3a5a",
                                    boxShadow: isLoaded
                                      ? `inset 0 1px 2px rgba(0,0,0,0.5), 0 0 6px ${t.color}30`
                                      : "inset 0 1px 2px rgba(0,0,0,0.5)",
                                  }}
                                >
                                  <div
                                    className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full"
                                    style={{ backgroundColor: isLoaded ? t.color : "#3a3a5a" }}
                                  />
                                </div>
                              ))}
                              <div className="absolute inset-x-7 md:inset-x-8 top-1/2 -translate-y-1/2 border-t border-dashed border-gray-700/40" />
                            </div>

                            {/* Title */}
                            <div className="px-1.5 py-1 border-t border-[#1a1a30]">
                              <p
                                className="font-pixel text-[4.5px] md:text-[5.5px] truncate text-center transition-colors"
                                style={{ color: isLoaded ? t.color : "#6b7280" }}
                              >
                                {t.title}
                              </p>
                            </div>
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
