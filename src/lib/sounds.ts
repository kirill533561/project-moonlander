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

// ── 8-bit space theme song ──────────────────────────────────

let themeGain: GainNode | null = null;
let themeTimer: ReturnType<typeof setTimeout> | null = null;
let _playing = false;

function note(
  c: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  vol: number
) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.92);
  osc.connect(g);
  g.connect(dest);
  osc.start(start);
  osc.stop(start + dur);
}

function scheduleLoop() {
  if (!_playing) return;
  const c = getCtx();
  if (!c || !themeGain) return;

  const BPM = 118;
  const s = 60 / (BPM * 2);
  const t = c.currentTime + 0.05;
  const loop = 32 * s;

  const lead: [number, number, number][] = [
    [0, 330, 2], [2, 392, 2], [4, 494, 1], [5, 494, 1], [6, 440, 2],
    [8, 392, 2], [10, 440, 2], [12, 494, 2], [14, 587, 2],
    [16, 523, 2], [18, 494, 2], [20, 440, 1], [21, 440, 1], [22, 392, 2],
    [24, 440, 2], [26, 392, 2], [28, 370, 2], [30, 330, 2],
  ];

  const bass: [number, number, number][] = [
    [0, 82, 8], [8, 98, 8], [16, 110, 8], [24, 82, 4], [28, 123, 4],
  ];

  const arp: [number, number, number][] = [
    [0, 165, 1], [1, 196, 1], [2, 247, 1], [3, 196, 1],
    [4, 165, 1], [5, 196, 1], [6, 247, 1], [7, 196, 1],
    [8, 196, 1], [9, 247, 1], [10, 294, 1], [11, 247, 1],
    [12, 196, 1], [13, 247, 1], [14, 294, 1], [15, 247, 1],
    [16, 220, 1], [17, 262, 1], [18, 330, 1], [19, 262, 1],
    [20, 220, 1], [21, 262, 1], [22, 330, 1], [23, 262, 1],
    [24, 165, 1], [25, 196, 1], [26, 247, 1], [27, 196, 1],
    [28, 165, 1], [29, 196, 1], [30, 247, 1], [31, 196, 1],
  ];

  lead.forEach(([i, f, d]) =>
    note(c, themeGain!, f, t + i * s, d * s, "square", 0.07)
  );
  bass.forEach(([i, f, d]) =>
    note(c, themeGain!, f, t + i * s, d * s, "triangle", 0.10)
  );
  arp.forEach(([i, f, d]) =>
    note(c, themeGain!, f, t + i * s, d * s * 0.8, "square", 0.025)
  );

  themeTimer = setTimeout(scheduleLoop, (loop - 0.1) * 1000);
}

export function startThemeSong() {
  if (_playing) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  themeGain = c.createGain();
  themeGain.gain.setValueAtTime(0.55, c.currentTime);
  themeGain.connect(c.destination);
  _playing = true;
  scheduleLoop();
}

export function stopThemeSong() {
  _playing = false;
  if (themeTimer) {
    clearTimeout(themeTimer);
    themeTimer = null;
  }
  if (themeGain) {
    themeGain.disconnect();
    themeGain = null;
  }
}

export function isThemePlaying() {
  return _playing;
}
