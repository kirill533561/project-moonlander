"use client";

import { useState, useRef } from "react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { playMissionComplete, playCounterClick } from "@/lib/sounds";

interface RewardWheelProps {
  canSpin: boolean;
}

const COLORS = [
  "#b967ff", "#00ffff", "#ffd700", "#00ff41",
  "#ff4444", "#4488ff", "#ff8844", "#b967ff",
  "#00ffff", "#ffd700",
];

export function RewardWheel({ canSpin }: RewardWheelProps) {
  const [rewards, setRewards] = useLocalStorage<string[]>("ml-rewards", []);
  const [newReward, setNewReward] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const addReward = () => {
    if (!newReward.trim()) return;
    setRewards((prev) => [...prev, newReward.trim()]);
    setNewReward("");
  };

  const deleteReward = (idx: number) => {
    setRewards((prev) => prev.filter((_, i) => i !== idx));
  };

  const spin = () => {
    if (spinning || rewards.length < 2 || !canSpin) return;
    setSpinning(true);
    setResult(null);
    playCounterClick();

    const winnerIdx = Math.floor(Math.random() * rewards.length);
    const sliceAngle = 360 / rewards.length;
    const targetAngle = 360 - (winnerIdx * sliceAngle + sliceAngle / 2);
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const newRotation = rotation + fullSpins * 360 + targetAngle;
    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      setResult(rewards[winnerIdx]);
      playMissionComplete();
    }, 4000);
  };

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  function slicePath(i: number, total: number): string {
    const angle = 360 / total;
    const startAngle = (i * angle - 90) * (Math.PI / 180);
    const endAngle = ((i + 1) * angle - 90) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > 180 ? 1 : 0;
    return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
  }

  function labelPos(i: number, total: number): { x: number; y: number; angle: number } {
    const angle = 360 / total;
    const midAngle = (i * angle + angle / 2 - 90) * (Math.PI / 180);
    return {
      x: cx + r * 0.6 * Math.cos(midAngle),
      y: cy + r * 0.6 * Math.sin(midAngle),
      angle: i * angle + angle / 2,
    };
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Reward list */}
      <div className="pixel-card p-4">
        <h3 className="font-pixel text-xs text-pixel-gold mb-3">MY REWARDS</h3>
        {rewards.length === 0 ? (
          <p className="font-pixel-body text-lg text-gray-500 mb-3">No rewards yet — add some below!</p>
        ) : (
          <div className="flex flex-col gap-2 mb-3">
            {rewards.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-[#1a1a3a] px-3 py-2 border border-[#2a2a4a]">
                <span className="font-pixel-body text-lg text-white">{r}</span>
                <button onClick={() => deleteReward(i)}
                  className="pixel-btn w-8 h-8 flex items-center justify-center text-base border-pixel-red/50 text-pixel-red/50 hover:border-pixel-red hover:text-pixel-red">−</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input placeholder="Add a reward..." value={newReward}
            onChange={(e) => setNewReward(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addReward()}
            className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-lg px-3 py-2 flex-1 focus:border-pixel-gold focus:outline-none" />
          <button onClick={addReward} className="pixel-btn pixel-btn-gold px-4 py-2">+</button>
        </div>
      </div>

      {/* Wheel */}
      {rewards.length >= 2 && (
        <div className="pixel-card p-6 flex flex-col items-center gap-6">
          <h3 className="font-pixel text-xs text-pixel-gold">REWARD WHEEL</h3>

          {/* Pointer triangle */}
          <div className="relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <div style={{
                width: 0, height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "16px solid #ffd700",
                filter: "drop-shadow(0 0 4px #ffd700)",
              }} />
            </div>

            {/* SVG Wheel */}
            <svg
              width={size} height={size}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
              }}
            >
              {/* Border circle */}
              <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke="#ffd700" strokeWidth="3" />

              {/* Slices */}
              {rewards.map((reward, i) => {
                const color = COLORS[i % COLORS.length];
                const lp = labelPos(i, rewards.length);
                const truncated = reward.length > 14 ? reward.slice(0, 14) + "…" : reward;
                return (
                  <g key={i}>
                    <path d={slicePath(i, rewards.length)} fill={color + "44"} stroke={color} strokeWidth="1.5" />
                    <text
                      x={lp.x} y={lp.y}
                      textAnchor="middle" dominantBaseline="central"
                      fill="white"
                      fontSize="11"
                      fontFamily="VT323, monospace"
                      transform={`rotate(${lp.angle}, ${lp.x}, ${lp.y})`}
                    >
                      {truncated}
                    </text>
                  </g>
                );
              })}

              {/* Center dot */}
              <circle cx={cx} cy={cy} r="8" fill="#0f0f2a" stroke="#ffd700" strokeWidth="2" />
            </svg>
          </div>

          {/* Spin button */}
          <button onClick={spin} disabled={spinning || !canSpin}
            className={`pixel-btn pixel-btn-gold px-8 py-4 font-pixel text-sm ${
              !canSpin ? "opacity-40 cursor-not-allowed" : spinning ? "opacity-60" : "animate-glow"
            }`}>
            {spinning ? "SPINNING..." : !canSpin ? "COMPLETE MONTH TO SPIN" : "🎰 SPIN THE WHEEL"}
          </button>

          {!canSpin && (
            <p className="font-pixel-body text-base text-gray-500 text-center">
              Hit 90%+ monthly completion to unlock the wheel!
            </p>
          )}

          {/* Result */}
          {result && (
            <div className="pixel-card p-6 text-center border-2 border-pixel-gold animate-glow w-full">
              <p className="font-pixel text-[10px] text-pixel-gold mb-2">YOUR REWARD</p>
              <p className="font-pixel-body text-3xl text-pixel-gold">{result}</p>
              <p className="font-pixel-body text-lg text-gray-400 mt-2">Enjoy it, Commander! You earned it 🚀</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
