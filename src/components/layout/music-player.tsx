"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const r = size / 2;
  const inner = r * 0.7;

  return (
    <div
      className="relative rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle, #1a1a2e 40%, #12122a 70%, #0a0a1a)",
        boxShadow: "inset 0 2px 6px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      <div
        className={`absolute rounded-full ${spinning ? "animate-[spin_1.8s_linear_infinite]" : ""}`}
        style={{ width: inner * 2, height: inner * 2 }}
      >
        {Array.from({ length: spokeCount }).map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 h-px bg-gray-600/50"
            style={{
              width: inner,
              transformOrigin: "0 0",
              transform: `rotate(${(360 / spokeCount) * i}deg)`,
            }}
          />
        ))}
      </div>
      <div
        className="relative z-10 rounded-full border-2 border-gray-600"
        style={{
          width: size * 0.22,
          height: size * 0.22,
          background: "radial-gradient(circle, #2a2a4a, #0a0a1a)",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8)",
        }}
      />
      <div
        className="absolute rounded-full border border-gray-700/30"
        style={{ width: inner * 1.5, height: inner * 1.5 }}
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
      setInserting(idx);
      setTimeout(() => {
        setLoaded(idx);
        setInserting(null);
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

      {/* Header trigger button */}
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

      {/* Full-screen modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6"
          >
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ scale: 0.85, y: 30, rotateX: 8 }}
              animate={{ scale: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 0.85, y: 30, rotateX: 8 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-lg"
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

              {/* ── Recorder body ── */}
              <div
                className="rounded-sm overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, #1e1e3a 0%, #14142a 40%, #10102a 100%)",
                  boxShadow: "0 2px 0 rgba(255,255,255,0.04) inset, 0 -1px 0 #0a0a1a inset, 0 20px 50px rgba(0,0,0,0.6), 0 4px 0 #0a0a12",
                  border: "2px solid #2a2a4a",
                }}
              >
                {/* Brand label */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <p className="font-pixel text-[7px] text-gray-500 tracking-[0.25em]">MOONLANDER</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${playing ? "bg-pixel-green shadow-[0_0_6px_#00ff41]" : "bg-gray-700"}`} />
                    <p className="font-pixel text-[6px] text-gray-600">{playing ? "PLAY" : "STOP"}</p>
                  </div>
                </div>

                {/* Tape window */}
                <div
                  className="mx-3 mb-3 p-4 relative overflow-hidden rounded-sm"
                  style={{
                    background: "linear-gradient(180deg, #080816 0%, #0c0c1e 100%)",
                    boxShadow: "inset 0 4px 16px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="flex items-center justify-center gap-5 md:gap-8">
                    <Reel3D spinning={playing} size={52} />
                    <div className="flex-1 max-w-[80px] flex flex-col gap-1.5">
                      {[0.5, 0.3, 0.5].map((o, i) => (
                        <div key={i} className="h-px rounded" style={{ backgroundColor: `rgba(139, 90, 43, ${o})` }} />
                      ))}
                    </div>
                    <Reel3D spinning={playing} size={52} />
                  </div>

                  {track && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 0.6, y: 0 }}
                      className="mt-3 mx-auto w-36 h-9 border border-[#2a2a4a] overflow-hidden rounded-sm"
                    >
                      <CassetteLabel track={track} />
                    </motion.div>
                  )}

                  {!track && inserting === null && (
                    <p className="font-pixel text-[6px] text-gray-600 text-center mt-4 tracking-wider">
                      INSERT TAPE
                    </p>
                  )}

                  {/* Insertion animation overlay */}
                  <AnimatePresence>
                    {inserting !== null && (
                      <motion.div
                        initial={{ y: 140, rotateX: -30, scale: 0.9, opacity: 0.9 }}
                        animate={{ y: 0, rotateX: 0, scale: 0.7, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
                        style={{ perspective: 600 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      >
                        <div
                          className="w-28 h-[72px] overflow-hidden rounded-sm"
                          style={{
                            border: `2px solid ${TRACKS[inserting].color}60`,
                            background: "#12122a",
                            boxShadow: `0 0 20px ${TRACKS[inserting].color}30, 0 8px 20px rgba(0,0,0,0.5)`,
                          }}
                        >
                          <div className="w-full h-10 overflow-hidden border-b border-[#2a2a4a]">
                            <CassetteLabel track={TRACKS[inserting]} />
                          </div>
                          <div className="flex items-center justify-between px-5 py-1.5">
                            <div className="w-3 h-3 rounded-full border border-gray-600" />
                            <div className="w-3 h-3 rounded-full border border-gray-600" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Now playing text */}
                <div className="px-4 mb-2">
                  <p className="font-pixel text-[7px] md:text-[8px] text-pixel-cyan text-center truncate h-4">
                    {track ? track.title : "SELECT A CASSETTE"}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="px-4 mb-3">
                  <div
                    onClick={seek}
                    className="h-3 cursor-pointer group relative rounded-sm overflow-hidden"
                    style={{
                      background: "#0a0a18",
                      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.02)",
                    }}
                  >
                    <motion.div
                      className="h-full relative"
                      style={{
                        width: `${pct}%`,
                        background: track
                          ? `linear-gradient(90deg, ${track.color}90, ${track.color})`
                          : "#00ffff",
                        boxShadow: track ? `0 0 8px ${track.color}40` : undefined,
                      }}
                      transition={{ duration: 0.1 }}
                    >
                      <div className="absolute right-0 top-0 w-px h-full bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="font-pixel-body text-[11px] text-gray-500">{fmt(progress)}</span>
                    <span className="font-pixel-body text-[11px] text-gray-500">{fmt(duration)}</span>
                  </div>
                </div>

                {/* Transport controls */}
                <div className="flex items-center justify-center gap-3 px-4 pb-4">
                  {([
                    { label: "⏮", action: prev, w: "w-11 h-11" },
                    { label: playing ? "⏸" : "▶", action: () => (playing ? pause() : play()), w: "w-14 h-14 text-xl" },
                    { label: "⏭", action: next, w: "w-11 h-11" },
                  ] as const).map((btn, i) => (
                    <motion.button
                      key={i}
                      onClick={btn.action}
                      disabled={loaded === null}
                      whileTap={{ y: 2, boxShadow: "0 1px 0 #0a0a1a" }}
                      className={`${btn.w} border-2 flex items-center justify-center font-pixel-body transition-colors disabled:opacity-25 disabled:cursor-not-allowed ${
                        i === 1 && playing
                          ? "border-pixel-cyan text-pixel-cyan"
                          : "border-[#3a3a5a] text-gray-400 hover:border-pixel-cyan hover:text-pixel-cyan"
                      }`}
                      style={{
                        background: "linear-gradient(180deg, #1e1e3a, #14142a)",
                        boxShadow: "0 3px 0 #0a0a1a, 0 5px 12px rgba(0,0,0,0.4)",
                      }}
                    >
                      {btn.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* ── Tape collection ── */}
              <p className="font-pixel text-[7px] text-gray-500 mt-5 mb-3 tracking-[0.15em]">
                TAPE COLLECTION
              </p>
              <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
                {TRACKS.map((t, i) => {
                  const isLoaded = loaded === i;
                  const isInserting = inserting === i;

                  return (
                    <motion.button
                      key={i}
                      onClick={() => insertCassette(i)}
                      whileHover={!isInserting ? { y: -6, rotateX: -4, rotateY: 3 } : undefined}
                      whileTap={!isInserting ? { scale: 0.96 } : undefined}
                      animate={
                        isInserting
                          ? { y: -60, rotateX: 40, scale: 0.5, opacity: 0 }
                          : { y: 0, rotateX: 5, rotateY: 0, scale: 1, opacity: 1 }
                      }
                      transition={
                        isInserting
                          ? { duration: 0.7, ease: [0.4, 0, 0.2, 1] }
                          : { type: "spring", stiffness: 300, damping: 20 }
                      }
                      style={{ perspective: 600, transformStyle: "preserve-3d" }}
                      className="flex-shrink-0 w-[120px] md:w-[140px] snap-center"
                    >
                      <div
                        className="overflow-hidden transition-shadow duration-300"
                        style={{
                          background: "linear-gradient(180deg, #18183a, #10102a)",
                          border: `2px solid ${isLoaded ? t.color : "#2a2a4a"}`,
                          boxShadow: isLoaded
                            ? `0 0 16px ${t.color}25, 0 8px 20px rgba(0,0,0,0.5), 0 3px 0 #0a0a12`
                            : "0 8px 20px rgba(0,0,0,0.4), 0 3px 0 #0a0a12",
                        }}
                      >
                        {/* Cover art label */}
                        <div
                          className="w-full h-[72px] md:h-[84px] border-b border-[#2a2a4a] overflow-hidden relative"
                          style={{ boxShadow: "inset 0 -2px 6px rgba(0,0,0,0.4)" }}
                        >
                          <CassetteLabel track={t} />
                          {isLoaded && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{ boxShadow: `inset 0 0 20px ${t.color}15` }}
                            />
                          )}
                        </div>

                        {/* Tape reels section */}
                        <div
                          className="flex items-center justify-between px-5 py-2.5 relative"
                          style={{ background: "linear-gradient(180deg, #0e0e22, #0a0a1a)" }}
                        >
                          {[0, 1].map((r) => (
                            <div key={r} className="relative">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isLoaded ? "animate-[spin_2s_linear_infinite]" : ""}`}
                                style={{ borderColor: isLoaded ? t.color : "#3a3a5a" }}
                              >
                                <div
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: isLoaded ? t.color : "#3a3a5a" }}
                                />
                              </div>
                            </div>
                          ))}
                          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 border-t border-dashed border-gray-700/50" />
                        </div>

                        {/* Title */}
                        <div className="px-2 py-1.5 border-t border-[#1a1a3a]">
                          <p
                            className="font-pixel text-[5px] md:text-[6px] truncate text-center transition-colors"
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
      </AnimatePresence>
    </>
  );
}
