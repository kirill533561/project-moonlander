export interface BadgeInfo {
  name: string;
  level: string;
  color: string;
  emoji: string;
}

export function getMonthlyBadge(completionPct: number): BadgeInfo {
  if (completionPct >= 0.9) {
    return { name: "Mars Pioneer", level: "gold", color: "#ffd700", emoji: "🏆" };
  }
  if (completionPct >= 0.7) {
    return { name: "Lunar Landing", level: "silver", color: "#c0c0c0", emoji: "🌙" };
  }
  if (completionPct >= 0.5) {
    return { name: "Orbit Achieved", level: "bronze", color: "#cd7f32", emoji: "🛰️" };
  }
  return { name: "Ground Control", level: "grey", color: "#666", emoji: "📡" };
}

export function getYearlyBadge(goalsMetPct: number): BadgeInfo {
  if (goalsMetPct >= 1) {
    return { name: "Galactic Legend", level: "legendary", color: "#ffd700", emoji: "⭐" };
  }
  if (goalsMetPct >= 0.75) {
    return { name: "Star Commander", level: "gold", color: "#ffd700", emoji: "🌟" };
  }
  if (goalsMetPct >= 0.5) {
    return { name: "Space Cadet", level: "silver", color: "#c0c0c0", emoji: "🚀" };
  }
  return { name: "Lost in Space", level: "grey", color: "#666", emoji: "🌌" };
}

export function getBadgeGradient(level: string): string {
  switch (level) {
    case "legendary": return "from-yellow-400 via-amber-300 to-yellow-500";
    case "gold": return "from-yellow-500 to-amber-600";
    case "silver": return "from-gray-300 to-gray-500";
    case "bronze": return "from-amber-600 to-orange-800";
    default: return "from-gray-600 to-gray-800";
  }
}
