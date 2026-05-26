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

export function playDreamAdded() {
  // Spacey ascending "whoosh" — like a rocket launching a dream into orbit
  const notes: [number, number, OscillatorType][] = [
    [200, 0.08, "triangle"],
    [300, 0.08, "triangle"],
    [450, 0.08, "square"],
    [600, 0.1, "square"],
    [800, 0.12, "square"],
    [1000, 0.15, "sine"],
    [1200, 0.2, "sine"],
    [1600, 0.3, "sine"],
  ];
  let t = 0;
  notes.forEach(([freq, dur, type]) => {
    setTimeout(() => playTone(freq, dur, type), t * 1000);
    t += dur * 0.6;
  });
}

export function playDelete() {
  playTone(400, 0.1, "square");
  setTimeout(() => playTone(250, 0.15, "square"), 80);
  setTimeout(() => playTone(150, 0.2, "sawtooth"), 180);
}

export function playCassettePickup() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  // plastic click
  const o1 = c.createOscillator();
  const g1 = c.createGain();
  o1.type = "square";
  o1.frequency.setValueAtTime(2200, t);
  o1.frequency.exponentialRampToValueAtTime(1400, t + 0.02);
  g1.gain.setValueAtTime(0.08, t);
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  o1.connect(g1);
  g1.connect(c.destination);
  o1.start(t);
  o1.stop(t + 0.04);
  // rattle
  const o2 = c.createOscillator();
  const g2 = c.createGain();
  o2.type = "sawtooth";
  o2.frequency.setValueAtTime(3000, t + 0.03);
  o2.frequency.exponentialRampToValueAtTime(1800, t + 0.06);
  g2.gain.setValueAtTime(0.04, t + 0.03);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  o2.connect(g2);
  g2.connect(c.destination);
  o2.start(t + 0.03);
  o2.stop(t + 0.07);
}

export function playCassetteInsert() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  // slide in
  const o1 = c.createOscillator();
  const g1 = c.createGain();
  o1.type = "sawtooth";
  o1.frequency.setValueAtTime(350, t);
  o1.frequency.exponentialRampToValueAtTime(120, t + 0.18);
  g1.gain.setValueAtTime(0.06, t);
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  o1.connect(g1);
  g1.connect(c.destination);
  o1.start(t);
  o1.stop(t + 0.2);
  // mechanical click/lock
  const o2 = c.createOscillator();
  const g2 = c.createGain();
  o2.type = "square";
  o2.frequency.setValueAtTime(600, t + 0.2);
  g2.gain.setValueAtTime(0.1, t + 0.2);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
  o2.connect(g2);
  g2.connect(c.destination);
  o2.start(t + 0.2);
  o2.stop(t + 0.25);
  // thud
  const o3 = c.createOscillator();
  const g3 = c.createGain();
  o3.type = "sine";
  o3.frequency.setValueAtTime(100, t + 0.2);
  g3.gain.setValueAtTime(0.12, t + 0.2);
  g3.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  o3.connect(g3);
  g3.connect(c.destination);
  o3.start(t + 0.2);
  o3.stop(t + 0.3);
}

export function playCassetteStart() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  // play button chunk
  const o1 = c.createOscillator();
  const g1 = c.createGain();
  o1.type = "square";
  o1.frequency.setValueAtTime(180, t);
  g1.gain.setValueAtTime(0.1, t);
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  o1.connect(g1);
  g1.connect(c.destination);
  o1.start(t);
  o1.stop(t + 0.08);
  // head engage click
  const o2 = c.createOscillator();
  const g2 = c.createGain();
  o2.type = "square";
  o2.frequency.setValueAtTime(500, t + 0.1);
  g2.gain.setValueAtTime(0.06, t + 0.1);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  o2.connect(g2);
  g2.connect(c.destination);
  o2.start(t + 0.1);
  o2.stop(t + 0.14);
  // motor spin-up whir
  const o3 = c.createOscillator();
  const g3 = c.createGain();
  o3.type = "triangle";
  o3.frequency.setValueAtTime(60, t + 0.12);
  o3.frequency.exponentialRampToValueAtTime(220, t + 0.5);
  g3.gain.setValueAtTime(0.07, t + 0.12);
  g3.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
  o3.connect(g3);
  g3.connect(c.destination);
  o3.start(t + 0.12);
  o3.stop(t + 0.55);
}
