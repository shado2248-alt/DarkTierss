export type TierResult = {
  resultId: string;
  discordUserId: string;
  discordUsername: string;
  gamemode: string;
  previousRank: string;
  rankEarned: string;
  region: string;
  tester: string;
  timestamp: string;
  username: string;
};

export const EXTERNAL_API_URL = "/api/tierlist";

export const RANK_SCORE: Record<string, number> = {
  "High Tier 1": 10, "Low Tier 1": 9,
  "High Tier 2": 8,  "Low Tier 2": 7,
  "High Tier 3": 6,  "Low Tier 3": 5,
  "High Tier 4": 4,  "Low Tier 4": 3,
  "High Tier 5": 2,  "Low Tier 5": 1,
};

export const RANK_COLOR: Record<string, string> = {
  "High Tier 1": "#f59e0b", "Low Tier 1": "#fbbf24",
  "High Tier 2": "#e879f9", "Low Tier 2": "#c084fc",
  "High Tier 3": "#818cf8", "Low Tier 3": "#60a5fa",
  "High Tier 4": "#34d399", "Low Tier 4": "#86efac",
  "High Tier 5": "#94a3b8", "Low Tier 5": "#6b7280",
};

export const REGION_CLS: Record<string, string> = {
  "Asia":          "text-yellow-400 border-yellow-500/50 bg-yellow-500/10",
  "North America": "text-red-400 border-red-500/50 bg-red-500/10",
  "Europe":        "text-blue-400 border-blue-500/50 bg-blue-500/10",
  "Oceania":       "text-green-400 border-green-500/50 bg-green-500/10",
  "South America": "text-orange-400 border-orange-500/50 bg-orange-500/10",
  "NA":            "text-red-400 border-red-500/50 bg-red-500/10",
  "EU":            "text-blue-400 border-blue-500/50 bg-blue-500/10",
  "AS":            "text-yellow-400 border-yellow-500/50 bg-yellow-500/10",
  "OC":            "text-green-400 border-green-500/50 bg-green-500/10",
  "SA":            "text-orange-400 border-orange-500/50 bg-orange-500/10",
};

export function abbreviateRank(rank: string): string {
  return rank.replace("High Tier", "HT").replace("Low Tier", "LT").replace(/\s+/g, "");
}

export function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function fetchTierResults(): Promise<TierResult[]> {
  const res = await fetch(EXTERNAL_API_URL);
  if (!res.ok) throw new Error("Failed to fetch tier results");
  return res.json();
}

/** Per (username, gamemode): keep most recent result */
export function deduplicateResults(results: TierResult[]): TierResult[] {
  const map = new Map<string, TierResult>();
  for (const r of results) {
    const key = `${r.username.toLowerCase()}::${r.gamemode.toLowerCase()}`;
    const existing = map.get(key);
    if (!existing || new Date(r.timestamp) > new Date(existing.timestamp)) {
      map.set(key, r);
    }
  }
  return Array.from(map.values());
}

/** Per username: keep most recent test (any gamemode), sorted by rankEarned desc */
export function deduplicateByPlayer(results: TierResult[]): TierResult[] {
  const map = new Map<string, TierResult>();
  for (const r of results) {
    const key = r.username.toLowerCase();
    const existing = map.get(key);
    if (!existing || new Date(r.timestamp) > new Date(existing.timestamp)) {
      map.set(key, r);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => (RANK_SCORE[b.rankEarned] ?? 0) - (RANK_SCORE[a.rankEarned] ?? 0)
  );
}
