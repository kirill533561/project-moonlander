"use client";

import { useState, useRef } from "react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { playMissionComplete, playCounterClick } from "@/lib/sounds";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface RewardWheelProps {
  canSpin: boolean;
}

const WHEEL_COLORS = [
  "#b967ff", "#00ffff", "#ffd700", "#00ff41",
  "#ff4444", "#4488ff", "#ff8844", "#b967ff",
];

export function RewardWheel({ canSpin }: RewardWheelProps) {
  const [rewards, setRewards] = useLocalStorage<string[]>("ml-rewards", []);
  const [newReward, setNewReward] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

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

    const winnerIdx = Math.floor(Math.random() * rewards.length);
    const sliceAngle = 360 / rewards.length;
    const targetAngle = 360 - (winnerIdx * sliceAngle + sliceAngle / 2);
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const newRotation = rotation + fullSpins * 360 + targetAngle;
    setRotation(newRotation);

    playCounterClick();

    setTimeout(() => {
      setSpinning(false);
      setResult(rewards[winnerIdx]);
      playMissionComplete();
    }, 4000);
  };

  const sliceAngle = rewards.length > 0 ? 360 / rewards.length : 360;

  return (
    <div className="flex flex-col gap-4">
      {/* Reward list management */}
      <div className="pixel-card p-4">
        <h3 className="font-pixel text-xs text-pixel-gold mb-3">MY REWARDS</h3>

        {rewards.length === 0 ? (
          <p className="font-pixel-body text-lg text-gray-500 mb-3">
            No rewards yet — add some below!
          </p>
        ) : (
          <div className="flex flex-col gap-2 mb-3">
            {rewards.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-[#1a1a3a] px-3 py-2 border border-[#2a2a4a]">
                <span className="font-pixel-body text-lg text-white">{r}</span>
                <button
                  onClick={() => deleteReward(i)}
                  className="font-pixel-body text-lg text-pixel-red hover:text-red-300 px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            placeholder="Add a reward..."
            value={newReward}
            onChange={(e) => setNewReward(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addReward()}
            className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-lg px-3 py-2 flex-1 focus:border-pixel-gold focus:outline-none"
          />
          <button onClick={addReward} className="pixel-btn pixel-btn-gold px-4 py-2">
            +
          </button>
        </div>
      </div>

      {/* Wheel */}
      {rewards.length >= 2 && (
        <div className="pixel-card p-6 flex flex-col items-center gap-6">
          <h3 className="font-pixel text-xs text-pixel-gold">REWARD WHEEL</h3>

          {/* Pointer */}
          <div className="relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-2xl">▼</div>

            {/* Wheel */}
            <div
              ref={wheelRef}
              className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-pixel-gold relative overflow-hidden"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
              }}
            >
              {rewards.map((reward, i) => {
                const startAngle = i * sliceAngle;
                const midAngle = startAngle + sliceAngle / 2;
                const color = WHEEL_COLORS[i % WHEEL_COLORS.length];

                return (
                  <div
                    key={i}
                    className="absolute w-full h-full"
                    style={{
                      clipPath: rewards.length === 2
                        ? `polygon(50% 50%, ${i === 0 ? "50% 0%, 100% 0%, 100% 100%, 50% 100%" : "50% 0%, 0% 0%, 0% 100%, 50% 100%"})`
                        : `polygon(50% 50%, ${50 + 50 * Math.cos((startAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startAngle - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((startAngle + sliceAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startAngle + sliceAngle - 90) * Math.PI / 180)}%)`,
                      backgroundColor: color + "33",
                      borderRight: `2px solid ${color}66`,
                    }}
                  >
                    <span
                      className="absolute font-pixel-body text-sm text-white text-center w-20 -ml-10"
                      style={{
                        left: `${50 + 30 * Math.cos((midAngle - 90) * Math.PI / 180)}%`,
                        top: `${50 + 30 * Math.sin((midAngle - 90) * Math.PI / 180)}%`,
                        transform: `translate(-50%, -50%) rotate(${midAngle}deg)`,
                      }}
                    >
                      {reward.length > 12 ? reward.slice(0, 12) + "…" : reward}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spin button */}
          <button
            onClick={spin}
            disabled={spinning || !canSpin}
            className={`pixel-btn pixel-btn-gold px-8 py-4 font-pixel text-sm ${
              !canSpin ? "opacity-40 cursor-not-allowed" : spinning ? "opacity-60" : "animate-glow"
            }`}
          >
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
              <p className="font-pixel-body text-lg text-gray-400 mt-2">
                Enjoy it, Commander! You earned it 🚀
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
