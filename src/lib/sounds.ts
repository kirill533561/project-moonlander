"use client";

const AudioCtx = typeof window !== "undefined" ? window.AudioContext : null;

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx && AudioCtx) ctx = new AudioCtx();
  return ctx!;
}

function playTone(freq: number, duration: number, type: OscillatorType = "square") {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  gain.gain.setValueAtTime(0.15, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

export function playCounterClick() {
  playTone(800, 0.08, "square");
  setTimeout(() => playTone(1200, 0.06, "square"), 60);
}

export function playSuccess() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, "square"), i * 120);
  });
}

export function playLevelUp() {
  const melody = [
    [392, 0.1], [440, 0.1], [494, 0.1], [523, 0.1],
    [587, 0.1], [659, 0.1], [784, 0.2], [784, 0.15],
    [659, 0.2],
  ] as [number, number][];
  let t = 0;
  melody.forEach(([freq, dur]) => {
    setTimeout(() => playTone(freq, dur, "square"), t * 1000);
    t += dur + 0.02;
  });
}

export function playMissionComplete() {
  const melody = [
    [523, 0.12], [523, 0.12], [523, 0.12], [523, 0.3],
    [415, 0.3], [466, 0.3], [523, 0.15], [466, 0.08], [523, 0.5],
  ] as [number, number][];
  let t = 0;
  melody.forEach(([freq, dur]) => {
    setTimeout(() => playTone(freq, dur, "square"), t * 1000);
    t += dur + 0.04;
  });
}

export function playError() {
  playTone(200, 0.2, "sawtooth");
  setTimeout(() => playTone(150, 0.3, "sawtooth"), 200);
}
