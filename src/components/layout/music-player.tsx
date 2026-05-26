"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TRACKS = [
  {
    src: "/music/Final_Approach.mp3",
    title: "FINAL APPROACH",
    cover: null as string | null,
    color: "#00ffff",
  },
  {
    src: "/music/Crossing_the_Far_Perimeter.mp3",
    title: "CROSSING THE FAR PERIMETER",
    cover: null as string | null,
    color: "#b967ff",
  },
  {
    src: "/music/Approaching_the_Far_Side.mp3",
    title: "APPROACHING THE FAR SIDE",
    cover: "/music/Approaching_the_Far_Side.jpg",
    color: "#ffd700",
  },
];

function fmt(s: number) {
  if (!s || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function Reel({ spinning, size = 48 }: { spinning: boolean; size?: number }) {
  return (
    <div
      className="relative rounded-full border-2 border-gray-600 bg-[#1a1a2e] flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className={`absolute inset-1 rounded-full border border-gray-700 ${spinning ? "animate-[spin_2s_linear_infinite]" : ""}`}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-600" />
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-0.5 bg-gray-600" />
        <div className="absolute top-0 left-0 w-full h-full rotate-45">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-700" />
        </div>
      </div>
      <div className="w-2.5 h-2.5 rounded-full bg-[#0a0a1a] border border-gray-500 z-10" />
    </div>
  );
}

function CassetteLabel({
  track,
}: {
  track: (typeof TRACKS)[number];
}) {
  if (track.cover) {
    return (
      <img
        src={track.cover}
        alt={track.title}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <div
      className="w-full h-full flex items-center justify-center p-2"
      style={{
        background: `linear-gradient(135deg, ${track.color}18, #0a0a1a 40%, ${track.color}10)`,
      }}
    >
      <span
        className="font-pixel text-[6px] md:text-[7px] leading-relaxed text-center break-words"
        style={{ color: track.color }}
      >
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
    const a = audioRef.current;
    if (!a) return;
    a.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const next = useCallback(() => {
    const nextIdx = loaded !== null ? (loaded + 1) % TRACKS.length : 0;
    insertCassette(nextIdx);
  }, [loaded]);

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    const prevIdx =
      loaded !== null
        ? (loaded - 1 + TRACKS.length) % TRACKS.length
        : TRACKS.length - 1;
    insertCassette(prevIdx);
  }, [loaded]);

  const insertCassette = (idx: number) => {
    if (inserting !== null) return;
    if (loaded === idx) {
      playing ? pause() : play();
      return;
    }
    setInserting(idx);
    setTimeout(() => {
      setLoaded(idx);
      setInserting(null);
    }, 700);
  };

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
      const nextIdx = loaded !== null ? (loaded + 1) % TRACKS.length : 0;
      setLoaded(nextIdx);
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

      {/* Collapsed bar */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-1.5 bg-space-deeper/80 border-b-2 border-[#2a2a4a] hover:bg-[#1a1a3a] transition-colors w-full"
      >
        <span className="text-sm">📼</span>
        <span className="font-pixel text-[7px] text-gray-500 tracking-wider">
          MISSION AUDIO
        </span>
        {playing && track && (
          <>
            <span className="font-pixel text-[7px] text-pixel-cyan truncate hidden sm:inline ml-1">
              {track.title}
            </span>
            <span className="font-pixel text-[7px] text-pixel-cyan animate-pulse ml-auto">
              ON AIR
            </span>
          </>
        )}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Content */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-lg"
            >
              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                className="absolute -top-2 -right-2 w-8 h-8 border-2 border-[#2a2a4a] bg-space-deeper text-gray-400 hover:text-white hover:border-pixel-cyan flex items-center justify-center font-pixel-body text-lg z-20 transition-colors"
              >
                ×
              </button>

              {/* Recorder */}
              <div className="pixel-card p-4 md:p-6">
                <p className="font-pixel text-[8px] text-gray-500 text-center mb-4 tracking-[0.2em]">
                  MISSION AUDIO DECK
                </p>

                {/* Tape window */}
                <div className="bg-[#0d0d1f] border-2 border-[#2a2a4a] p-4 mb-4 relative overflow-hidden">
                  <div className="flex items-center justify-center gap-6 md:gap-10">
                    <Reel spinning={playing} size={52} />
                    <div className="flex-1 max-w-[100px] flex flex-col gap-1">
                      <div className="h-0.5 bg-amber-900/60 rounded" />
                      <div className="h-0.5 bg-amber-900/40 rounded" />
                      <div className="h-0.5 bg-amber-900/60 rounded" />
                    </div>
                    <Reel spinning={playing} size={52} />
                  </div>

                  {/* Loaded cassette label (small, in the tape window) */}
                  {track && (
                    <div className="mt-3 mx-auto w-32 h-8 border border-[#2a2a4a] overflow-hidden opacity-70">
                      <CassetteLabel track={track} />
                    </div>
                  )}

                  {/* Inserting animation overlay */}
                  <AnimatePresence>
                    {inserting !== null && (
                      <motion.div
                        initial={{ y: 120, opacity: 0.8 }}
                        animate={{ y: 0, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.65, ease: "easeIn" }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-24 h-16 border-2 border-gray-500 bg-[#1a1a2e] flex items-center justify-center">
                          <div className="w-16 h-8 overflow-hidden">
                            <CassetteLabel track={TRACKS[inserting]} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!track && inserting === null && (
                    <p className="font-pixel text-[7px] text-gray-600 text-center mt-3">
                      NO TAPE LOADED
                    </p>
                  )}
                </div>

                {/* Now playing */}
                <p className="font-pixel text-[8px] text-pixel-cyan text-center mb-3 truncate h-4">
                  {track ? track.title : "SELECT A CASSETTE"}
                </p>

                {/* Progress bar */}
                <div className="mb-3">
                  <div
                    onClick={seek}
                    className="h-2.5 bg-[#1a1a2e] border border-[#2a2a4a] cursor-pointer mb-1 group"
                  >
                    <div
                      className="h-full bg-pixel-cyan/80 transition-[width] duration-200 relative"
                      style={{ width: `${pct}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-pixel-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-pixel-body text-xs text-gray-500">
                      {fmt(progress)}
                    </span>
                    <span className="font-pixel-body text-xs text-gray-500">
                      {fmt(duration)}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={prev}
                    disabled={loaded === null}
                    className="w-10 h-10 border-2 border-[#2a2a4a] flex items-center justify-center text-gray-400 hover:text-pixel-cyan hover:border-pixel-cyan transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-pixel-body"
                  >
                    ⏮
                  </button>
                  <button
                    onClick={() => (playing ? pause() : play())}
                    disabled={loaded === null}
                    className={`w-12 h-12 border-2 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-pixel-body text-lg ${
                      playing
                        ? "border-pixel-cyan text-pixel-cyan"
                        : "border-[#2a2a4a] text-gray-400 hover:border-pixel-cyan hover:text-pixel-cyan"
                    }`}
                  >
                    {playing ? "⏸" : "▶"}
                  </button>
                  <button
                    onClick={next}
                    disabled={loaded === null}
                    className="w-10 h-10 border-2 border-[#2a2a4a] flex items-center justify-center text-gray-400 hover:text-pixel-cyan hover:border-pixel-cyan transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-pixel-body"
                  >
                    ⏭
                  </button>
                </div>
              </div>

              {/* Cassette tapes */}
              <p className="font-pixel text-[7px] text-gray-500 mt-5 mb-3 tracking-[0.15em]">
                TAPE COLLECTION
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {TRACKS.map((t, i) => (
                  <motion.button
                    key={i}
                    onClick={() => insertCassette(i)}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    animate={
                      inserting === i
                        ? { y: -40, scale: 0.7, opacity: 0 }
                        : { y: 0, scale: 1, opacity: 1 }
                    }
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className={`flex-shrink-0 w-28 md:w-32 border-2 transition-colors ${
                      loaded === i
                        ? "border-pixel-cyan shadow-[0_0_12px_rgba(0,255,255,0.3)]"
                        : "border-[#2a2a4a] hover:border-gray-500"
                    } bg-[#12122a]`}
                  >
                    {/* Cover art label */}
                    <div className="w-full h-20 md:h-24 border-b border-[#2a2a4a] overflow-hidden">
                      <CassetteLabel track={t} />
                    </div>

                    {/* Tape reels */}
                    <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d1f]">
                      <div
                        className="w-4 h-4 rounded-full border-2"
                        style={{
                          borderColor:
                            loaded === i ? t.color : "#3a3a5a",
                        }}
                      >
                        <div className="w-full h-full rounded-full flex items-center justify-center">
                          <div
                            className="w-1 h-1 rounded-full"
                            style={{
                              backgroundColor:
                                loaded === i ? t.color : "#3a3a5a",
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex-1 mx-2 border-t border-dashed border-gray-700" />
                      <div
                        className="w-4 h-4 rounded-full border-2"
                        style={{
                          borderColor:
                            loaded === i ? t.color : "#3a3a5a",
                        }}
                      >
                        <div className="w-full h-full rounded-full flex items-center justify-center">
                          <div
                            className="w-1 h-1 rounded-full"
                            style={{
                              backgroundColor:
                                loaded === i ? t.color : "#3a3a5a",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="px-2 py-1.5 border-t border-[#2a2a4a]">
                      <p
                        className="font-pixel text-[5px] md:text-[6px] truncate text-center"
                        style={{
                          color: loaded === i ? t.color : "#6b7280",
                        }}
                      >
                        {t.title}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
