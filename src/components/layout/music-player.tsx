"use client";

import { useRef, useState, useEffect, useCallback } from "react";

const TRACKS = [
  { src: "/music/Final_Approach.mp3", title: "FINAL APPROACH" },
  { src: "/music/Crossing_the_Far_Perimeter.mp3", title: "CROSSING THE FAR PERIMETER" },
];

function fmt(s: number) {
  if (!s || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const track = TRACKS[idx];

  const play = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    playing ? pause() : play();
  }, [playing, play, pause]);

  const next = useCallback(() => {
    setIdx((i) => (i + 1) % TRACKS.length);
  }, []);

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
    } else {
      setIdx((i) => (i - 1 + TRACKS.length) % TRACKS.length);
    }
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const wasPlaying = playing;
    a.src = track.src;
    a.load();
    if (wasPlaying) {
      a.play().then(() => setPlaying(true)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.currentTime);
    const onDur = () => setDuration(a.duration);
    const onEnd = () => next();
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
  }, [next]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  if (!expanded) {
    return (
      <>
        <audio ref={audioRef} preload="metadata" />
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-space-deeper/80 border-b-2 border-[#2a2a4a] hover:bg-[#1a1a3a] transition-colors w-full"
        >
          <span className="text-sm">🎵</span>
          <span className="font-pixel text-[7px] text-gray-500 tracking-wider">
            MISSION AUDIO
          </span>
          {playing && (
            <span className="font-pixel text-[7px] text-pixel-cyan animate-pulse ml-auto">
              ON AIR
            </span>
          )}
        </button>
      </>
    );
  }

  return (
    <>
      <audio ref={audioRef} preload="metadata" />
      <div className="bg-space-deeper/95 backdrop-blur border-b-2 border-[#2a2a4a] px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(false)}
            className="text-gray-600 hover:text-gray-400 font-pixel-body text-xs shrink-0"
            title="Collapse"
          >
            ▼
          </button>

          <button
            onClick={prev}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-pixel-cyan transition-colors font-pixel-body text-sm shrink-0"
          >
            ⏮
          </button>
          <button
            onClick={togglePlay}
            className={`w-9 h-9 border-2 flex items-center justify-center transition-colors shrink-0 ${
              playing
                ? "border-pixel-cyan text-pixel-cyan"
                : "border-[#3a3a5a] text-gray-400 hover:border-pixel-cyan hover:text-pixel-cyan"
            }`}
          >
            <span className="font-pixel-body text-base">
              {playing ? "⏸" : "▶"}
            </span>
          </button>
          <button
            onClick={next}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-pixel-cyan transition-colors font-pixel-body text-sm shrink-0"
          >
            ⏭
          </button>

          <div className="flex-1 min-w-0 ml-1">
            <div className="flex items-center justify-between mb-1">
              <p className="font-pixel text-[7px] md:text-[8px] text-pixel-cyan truncate">
                {track.title}
              </p>
              <span className="font-pixel-body text-[10px] text-gray-500 ml-2 shrink-0">
                {fmt(progress)} / {fmt(duration)}
              </span>
            </div>
            <div
              onClick={seek}
              className="h-2 bg-[#1a1a3a] border border-[#2a2a4a] cursor-pointer group"
            >
              <div
                className="h-full bg-pixel-cyan transition-[width] duration-200 relative"
                style={{ width: `${pct}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-3 bg-pixel-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
