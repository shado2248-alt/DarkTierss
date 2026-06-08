import { useState } from "react";
import { useGetLeaderboard, useListGamemodes, useGetMe, useCreateMatch, useListPlayers } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TierBadge } from "@/components/ui/tier-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, X, Swords, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GamemodeIcon, trophyImg } from "@/lib/gamemode-icons";
import { fetchTierResults, deduplicateResults, abbreviateRank, RANK_SCORE } from "@/lib/tierlist-api";

const ROLE_RANK: Record<string, number> = { user: 0, tester: 1, moderator: 2, admin: 3, owner: 4 };
function isStaff(role: string) { return (ROLE_RANK[role] ?? 0) >= 1; }

const REGION_ABBR: Record<string, string> = {
  "Asia": "AS", "North America": "NA", "Europe": "EU",
  "Oceania": "OC", "South America": "SA",
};

function PostMatchModal({ onClose }: { onClose: () => void }) {
  const { data: players } = useListPlayers({ limit: 200 });
  const { data: gamemodes } = useListGamemodes();
  const createMatch = useCreateMatch();
  const qc = useQueryClient();
  const [form, setForm] = useState({ gamemodeId: "", player1Id: "", player2Id: "", winnerId: "", score: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const eligible = [form.player1Id, form.player2Id].filter(Boolean).map(id => players?.players?.find(p => p.id === +id)).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gamemodeId || !form.player1Id || !form.player2Id || !form.winnerId || !form.score) {
      setError("All fields are required."); return;
    }
    setCreating(true); setError(null);
    try {
      await createMatch.mutateAsync({ data: { gamemodeId: +form.gamemodeId, player1Id: +form.player1Id, player2Id: +form.player2Id, winnerId: +form.winnerId, score: form.score } });
      qc.invalidateQueries();
      setDone(true);
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setError(err.message ?? "Failed to create match.");
    } finally { setCreating(false); }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 glass-card border border-white/10 rounded-2xl p-6 w-full max-w-lg"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-black text-white">Post Match Result</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center">
            <div className="text-green-400 font-black text-lg mb-1">Match Posted!</div>
            <p className="text-sm text-muted-foreground">ELO updated and leaderboard refreshed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Gamemode", field: "gamemodeId", items: gamemodes?.map(g => ({ id: g.id, name: g.name })) },
                { label: "Player 1", field: "player1Id", items: players?.players?.map(p => ({ id: p.id, name: p.username })) },
                { label: "Player 2", field: "player2Id", items: players?.players?.map(p => ({ id: p.id, name: p.username })) },
                { label: "Winner", field: "winnerId", items: eligible?.map((p: any) => ({ id: p.id, name: p.username })) },
              ].map(({ label, field, items }) => (
                <div key={field}>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{label}</label>
                  <Select value={(form as any)[field]} onValueChange={v => setForm(f => ({ ...f, [field]: v }))}>
                    <SelectTrigger className="bg-black/40 border-white/10 text-white text-sm h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{items?.map((i: any) => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Score (e.g. 3-1)</label>
              <Input placeholder="3-1" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} className="bg-black/40 border-white/10 text-white h-9 text-sm" />
            </div>
            {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" disabled={creating} className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
              {creating ? "Posting..." : "Post Match"}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

/* ── Types ───────────────────────────────────────────────── */
type OverallPlayer = {
  rank: number;
  playerId: number;
  username: string;
  uuid: string;
  region: string | null;
  overallScore: number;
  rankedGamemodes: number;
  gamemodes: Array<{
    gamemodeId: number;
    gamemodeName: string;
    gamemodeSlug: string;
    tierName: string | null;
    tierColor: string | null;
    rating: number | null;
    peakRating: number | null;
  }>;
};

type LeaderboardEntry = {
  rank: number;
  playerId: number;
  username: string;
  uuid: string;
  region: string | null;
  tierName: string | null;
  tierColor: string | null;
  rating: number;
  wins: number;
  losses: number;
  totalMatches: number;
};

/* ── Helpers ─────────────────────────────────────────────── */
const REGION_CLS: Record<string, string> = {
  NA: "text-red-400 border-red-500/50 bg-red-500/10",
  EU: "text-blue-400 border-blue-500/50 bg-blue-500/10",
  AS: "text-yellow-400 border-yellow-500/50 bg-yellow-500/10",
  OC: "text-green-400 border-green-500/50 bg-green-500/10",
  SA: "text-orange-400 border-orange-500/50 bg-orange-500/10",
};

const TIER_NUM_STYLE: Record<number, { header: string; border: string; trophy: string }> = {
  1: { header: "text-yellow-400",  border: "border-yellow-500/30",  trophy: "#facc15" },
  2: { header: "text-slate-300",   border: "border-slate-400/30",   trophy: "#94a3b8" },
  3: { header: "text-orange-400",  border: "border-orange-500/30",  trophy: "#fb923c" },
  4: { header: "text-emerald-400", border: "border-emerald-500/30", trophy: "#34d399" },
  5: { header: "text-blue-400",    border: "border-blue-500/30",    trophy: "#60a5fa" },
};

function tierNumber(tierName: string | null): number {
  if (!tierName) return 5;
  if (tierName.includes("1")) return 1;
  if (tierName.includes("2")) return 2;
  if (tierName.includes("3")) return 3;
  if (tierName.includes("4")) return 4;
  return 5;
}

function RegionBadge({ region }: { region: string | null }) {
  if (!region) return null;
  return (
    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${REGION_CLS[region] ?? "bg-white/10 text-white border-white/20"}`}>
      {region}
    </span>
  );
}

/* ── Rank number badge ───────────────────────────────────── */
function RankBadge({ rank }: { rank: number }) {
  const base = "text-3xl font-black tabular-nums";
  if (rank === 1) return <span className={base} style={{ color: "#FFD700", textShadow: "0 0 12px rgba(255,215,0,0.6)" }}>{rank}.</span>;
  if (rank === 2) return <span className={base} style={{ color: "#C0C0C0", textShadow: "0 0 10px rgba(192,192,192,0.5)" }}>{rank}.</span>;
  if (rank === 3) return <span className={base} style={{ color: "#CD7F32", textShadow: "0 0 10px rgba(205,127,50,0.5)" }}>{rank}.</span>;
  return <span className={`${base} text-muted-foreground/50`}>{rank}.</span>;
}

/* ── Rank card styles ────────────────────────────────────── */
const RANK_CARD_STYLE: Record<number, { style: React.CSSProperties; className: string; diagonalColor: string }> = {
  1: {
    style: {
      borderColor: "rgba(255,215,0,0.85)",
      boxShadow: "0 0 32px rgba(255,215,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12)",
    },
    className: "border bg-card",
    diagonalColor: "linear-gradient(to bottom, rgba(218,178,0,0.92), rgba(180,142,0,0.86))",
  },
  2: {
    style: {
      borderColor: "rgba(192,192,192,0.80)",
      boxShadow: "0 0 28px rgba(192,192,192,0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
    },
    className: "border bg-card",
    diagonalColor: "linear-gradient(to bottom, rgba(130,150,162,0.90), rgba(100,120,135,0.84))",
  },
  3: {
    style: {
      borderColor: "rgba(205,127,50,0.80)",
      boxShadow: "0 0 24px rgba(205,127,50,0.20), inset 0 1px 0 rgba(255,255,255,0.10)",
    },
    className: "border bg-card",
    diagonalColor: "linear-gradient(to bottom, rgba(172,98,28,0.90), rgba(140,76,14,0.84))",
  },
};

/* ── Overall player card ─────────────────────────────────── */
function PlayerCard({
  player,
  gamemodes,
  isOwner,
  onRemoveTier,
}: {
  player: OverallPlayer;
  gamemodes: Array<{ id: number; name: string }>;
  isOwner: boolean;
  onRemoveTier: (playerId: number, username: string) => void;
}) {
  const rankedGms = player.gamemodes.filter(g => g.tierName);
  const medal = RANK_CARD_STYLE[player.rank];
  const isDbPlayer = player.playerId > 0;

  return (
    <div
      className={`relative flex rounded-xl overflow-hidden transition-all hover:border-primary/40 ${
        medal ? medal.className : "border bg-card border-border/40"
      }`}
      style={medal?.style}
    >
      {/* Solid colour diagonal for top 3 — covers rank + skin + player name */}
      {medal && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: medal.diagonalColor,
            clipPath: "polygon(0 0, 50% 0, 40% 100%, 0 100%)",
          }}
        />
      )}
      {/* Subtle glint shimmer on top */}
      {medal && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: "linear-gradient(105deg, transparent 28%, rgba(255,255,255,0.06) 47%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 53%, transparent 72%)",
            clipPath: "polygon(0 0, 50% 0, 40% 100%, 0 100%)",
          }}
        />
      )}
      {/* Left — rank + skin */}
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-4 min-w-[88px] flex-shrink-0 relative z-10">
        <RankBadge rank={player.rank} />
        <img
          src={`https://mc-heads.net/body/${player.uuid}/80`}
          alt={player.username}
          className="h-20 w-auto object-contain"
          onError={e => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/${player.uuid}/64`; }}
        />
      </div>

      {/* Right — info + tiers */}
      <div className="flex-1 px-5 py-4 min-w-0 relative z-10">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-black text-lg text-white leading-tight truncate">
            {player.username}
          </span>
          <RegionBadge region={player.region} />
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <p className="text-[11px] text-muted-foreground/50">
            {rankedGms.length} mode{rankedGms.length !== 1 ? "s" : ""} ranked
          </p>
          {(() => {
            const peaks = player.gamemodes.map(g => g.peakRating).filter((v): v is number => v != null && v > 0);
            const bestPeak = peaks.length > 0 ? Math.max(...peaks) : null;
            const bestCurrent = player.gamemodes.map(g => g.rating).filter((v): v is number => v != null && v > 0);
            const currentMax = bestCurrent.length > 0 ? Math.max(...bestCurrent) : null;
            if (!bestPeak) return null;
            const declined = currentMax != null && bestPeak > currentMax;
            return (
              <span className={`text-[11px] font-bold flex items-center gap-0.5 ${declined ? "text-amber-400/80" : "text-emerald-400/70"}`}>
                <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l4 8H1z"/></svg>
                Peak {bestPeak.toLocaleString()}
                {declined && <span className="text-red-400/60 font-normal ml-1">(−{(bestPeak - (currentMax ?? 0)).toLocaleString()})</span>}
              </span>
            );
          })()}
        </div>

        {rankedGms.length > 0 && (
          <div className="mt-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">Tiers</p>
            <div className="flex flex-wrap gap-3">
              {gamemodes.map(gm => {
                const entry = player.gamemodes.find(g => g.gamemodeId === gm.id);
                if (!entry?.tierName) return null;
                return (
                  <div key={gm.id} className="flex flex-col items-center gap-1">
                    <div className="w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center">
                      <GamemodeIcon name={gm.name} size={22} />
                    </div>
                    <TierBadge tierName={entry.tierName} tierColor={entry.tierColor} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Owner — remove tier button */}
      {isOwner && isDbPlayer && (
        <button
          onClick={() => onRemoveTier(player.playerId, player.username)}
          title="Remove tier"
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg flex items-center justify-center text-red-400/50 hover:text-red-400 hover:bg-red-500/15 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ── Per-gamemode tier column ────────────────────────────── */
function TierColumn({
  tierNum,
  entries,
}: {
  tierNum: number;
  entries: LeaderboardEntry[];
}) {
  const style = TIER_NUM_STYLE[tierNum] ?? TIER_NUM_STYLE[5];
  return (
    <div className={`flex-1 min-w-[200px] rounded-xl border ${style.border} bg-card/60 overflow-hidden`}>
      <div className={`px-4 py-3 border-b ${style.border} bg-black/20`}>
        <div className="flex items-center gap-2">
          <img src={trophyImg} alt="Tier" className="w-5 h-5 object-contain opacity-80" style={{ filter: `drop-shadow(0 0 4px ${style.trophy})` }} />
          <span className={`font-black text-sm ${style.header}`}>Tier {tierNum}</span>
        </div>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {entries.map(entry => {
          const isHT = entry.tierName?.startsWith("HT") ?? false;
          const isLT = entry.tierName?.startsWith("LT") ?? false;
          return (
            <div
              key={`${entry.playerId}-${entry.username}`}
              className={`flex items-center gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors border-l-2
                ${isHT ? "border-green-500/60" : isLT ? "border-red-500/60" : "border-transparent"}`}
            >
              <img
                src={`https://mc-heads.net/avatar/${entry.uuid}/20`}
                alt={entry.username}
                className="w-5 h-5 rounded flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/20"; }}
              />
              <span
                className={`text-[13px] font-semibold flex-1 min-w-0 break-words
                  ${isHT ? "text-green-300" : isLT ? "text-red-300" : "text-white/85"}`}
              >
                {entry.username}
              </span>
              {entry.tierName && (
                <span className={`text-[9px] font-black flex-shrink-0 px-1 py-0.5 rounded
                  ${isHT ? "text-green-400 bg-green-500/10" : isLT ? "text-red-400 bg-red-500/10" : "text-white/40"}`}>
                  {entry.tierName}
                </span>
              )}
              {entry.region && <RegionBadge region={entry.region} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
export default function Leaderboard() {
  const [view, setView] = useState<string>("overall");
  const [search, setSearch] = useState("");
  const [postMatchOpen, setPostMatchOpen] = useState(false);
  const [removingTier, setRemovingTier] = useState<{ playerId: number; username: string } | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const qc = useQueryClient();

  const { data: me } = useGetMe();
  const myRole = (me as any)?.role ?? "user";
  const isOwner = myRole === "owner";

  const { data: gamemodes } = useListGamemodes();

  /* Internal DB data */
  const { data: overallData, isLoading: overallLoading } = useQuery({
    queryKey: ["leaderboard-overall"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard/overall");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ players: OverallPlayer[]; total: number }>;
    },
    enabled: view === "overall",
  });

  const gamemodeId = view !== "overall" ? parseInt(view) : undefined;
  const { data: tableData, isLoading: tableLoading } = useGetLeaderboard(
    { gamemodeId, sortBy: "rating", limit: 500 },
    { query: { enabled: view !== "overall" } as any }
  );

  /* External API — always fetched, 10s polling */
  const { data: rawTierlist = [] } = useQuery({
    queryKey: ["tierlist-external"],
    queryFn: fetchTierResults,
    refetchInterval: 10_000,
    staleTime: 9_000,
  });

  /* Convert external results → OverallPlayer cards for Overall tab */
  const externalOverallPlayers: OverallPlayer[] = (() => {
    if (!gamemodes) return [];
    const deduped = deduplicateResults(rawTierlist);
    const byPlayer = new Map<string, typeof deduped>();
    for (const r of deduped) {
      const key = r.username.toLowerCase();
      if (!byPlayer.has(key)) byPlayer.set(key, []);
      byPlayer.get(key)!.push(r);
    }
    return Array.from(byPlayer.values())
      .map((results, i) => {
        const first = results[0];
        const bestScore = Math.max(...results.map(r => RANK_SCORE[r.rankEarned] ?? 0));
        return {
          rank: 0,
          playerId: -(i + 1),
          username: first.username,
          uuid: first.username,
          region: REGION_ABBR[first.region] ?? first.region ?? null,
          overallScore: bestScore,
          rankedGamemodes: results.length,
          gamemodes: results.map(r => ({
            gamemodeId: gamemodes.find(g => g.name.toLowerCase() === r.gamemode.toLowerCase())?.id ?? 0,
            gamemodeName: r.gamemode,
            gamemodeSlug: r.gamemode.toLowerCase(),
            tierName: abbreviateRank(r.rankEarned),
            tierColor: null,
            rating: null,
            peakRating: null,
          })),
        };
      })
      .sort((a, b) => b.overallScore - a.overallScore);
  })();

  /* Convert external results → LeaderboardEntry rows for per-gamemode tabs */
  const currentGamemodeName = gamemodes?.find(g => g.id.toString() === view)?.name ?? "";
  const externalGmEntries: LeaderboardEntry[] = deduplicateResults(rawTierlist)
    .filter(r => r.gamemode.toLowerCase() === currentGamemodeName.toLowerCase())
    .sort((a, b) => (RANK_SCORE[b.rankEarned] ?? 0) - (RANK_SCORE[a.rankEarned] ?? 0))
    .map((r, i) => ({
      rank: i + 1,
      playerId: -(i + 1),
      username: r.username,
      uuid: r.username,
      region: REGION_ABBR[r.region] ?? r.region ?? null,
      tierName: abbreviateRank(r.rankEarned),
      tierColor: null,
      rating: 0,
      wins: 0,
      losses: 0,
      totalMatches: 0,
    }));

  const handleRemoveTier = (playerId: number, username: string) => {
    setRemovingTier({ playerId, username });
  };

  const confirmRemoveTier = async () => {
    if (!removingTier) return;
    setRemoveLoading(true);
    try {
      await fetch(`/api/admin/players/${removingTier.playerId}/ratings`, { method: "DELETE" });
      qc.invalidateQueries();
    } finally {
      setRemoveLoading(false);
      setRemovingTier(null);
    }
  };

  const tabs = [
    { id: "overall", label: "Overall" },
    ...(gamemodes?.map(g => ({ id: g.id.toString(), label: g.name })) ?? []),
  ];

  const isLoading = view === "overall" ? overallLoading : tableLoading;

  /* Merge DB + external for Overall tab, deduplicated by username (case-insensitive) */
  const dbOverallPlayers = overallData?.players ?? [];
  // Deduplicate DB results by username (keep first/best per username)
  const seenDb = new Set<string>();
  const dedupedDb = dbOverallPlayers.filter(p => {
    const key = p.username.toLowerCase();
    if (seenDb.has(key)) return false;
    seenDb.add(key);
    return true;
  });
  const dbUsernames = new Set(dedupedDb.map(p => p.username.toLowerCase()));
  const mergedOverall = [
    ...dedupedDb,
    ...externalOverallPlayers.filter(p => !dbUsernames.has(p.username.toLowerCase())),
  ].map((p, i) => ({ ...p, rank: i + 1 }))
    .filter(p => !search || p.username.toLowerCase().includes(search.toLowerCase()));

  /* Merge DB + external for per-gamemode tab, deduplicated by username */
  const gmEntries = (tableData?.entries ?? []) as unknown as LeaderboardEntry[];
  const dbGmUsernames = new Set(gmEntries.map(e => e.username.toLowerCase()));
  const mergedGm = [
    ...gmEntries,
    ...externalGmEntries.filter(e => !dbGmUsernames.has(e.username.toLowerCase())),
  ].filter(e => !search || e.username.toLowerCase().includes(search.toLowerCase()));

  const tierCols = [1, 2, 3, 4, 5].map(n => ({
    tierNum: n,
    entries: mergedGm.filter(e => tierNumber(e.tierName) === n),
  })).filter(c => c.entries.length > 0);

  const activeIdx = tabs.findIndex(t => t.id === view);

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-screen-xl px-4 flex flex-col gap-0">

        {/* Header */}
        <div className="flex items-end justify-between mb-5 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Rankings</h1>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {view === "overall"
                ? `${mergedOverall.length} players ranked across all modes`
                : `${mergedGm.length} players · ${tabs.find(t => t.id === view)?.label ?? ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isStaff(myRole) && (
              <Button
                size="sm"
                onClick={() => setPostMatchOpen(true)}
                className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs h-8 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Post Match
              </Button>
            )}
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
              <Input
                placeholder="Search player..."
                className="pl-8 h-8 text-xs bg-card border-border/40 text-white placeholder:text-muted-foreground/40"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {postMatchOpen && <PostMatchModal onClose={() => setPostMatchOpen(false)} />}
        </AnimatePresence>

        {/* Owner — Remove Tier confirm dialog */}
        <AnimatePresence>
          {removingTier && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !removeLoading && setRemovingTier(null)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="relative z-10 glass-card border border-red-500/30 rounded-2xl p-6 w-full max-w-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <h2 className="text-base font-black text-white">Remove Tier</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  Remove all tier rankings for <span className="text-white font-bold">{removingTier.username}</span>? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRemovingTier(null)}
                    disabled={removeLoading}
                    className="flex-1 text-muted-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={confirmRemoveTier}
                    disabled={removeLoading}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                  >
                    {removeLoading ? "Removing..." : "Remove"}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Gamemode tabs */}
        <div className="flex items-end overflow-x-auto scrollbar-none gap-0.5">
          {tabs.map((tab) => {
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setView(tab.id); setSearch(""); }}
                className={`relative flex-shrink-0 flex flex-col items-center gap-1.5 px-5 py-3 text-[11px] font-bold whitespace-nowrap transition-all rounded-t-xl -mb-px
                  ${active
                    ? "text-white bg-card border-2 border-border/60 z-10"
                    : "text-muted-foreground/50 hover:text-white/70"
                  }`}
                style={active ? { borderBottomColor: "hsl(var(--card))" } : {}}
              >
                {tab.id === "overall"
                  ? <img src={trophyImg} alt="Overall" className="w-7 h-7 object-contain" />
                  : <GamemodeIcon name={tab.label} size={28} />
                }
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`border-2 border-border/60 bg-card overflow-hidden p-5
              ${activeIdx === 0 ? "rounded-b-xl rounded-tr-xl" : "rounded-xl"}`}
          >
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 bg-white/4 rounded-xl" />
                ))}
              </div>
            ) : view === "overall" ? (
              mergedOverall.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {mergedOverall.map(player => (
                    <PlayerCard
                      key={player.playerId}
                      player={player}
                      gamemodes={gamemodes?.map(g => ({ id: g.id, name: g.name })) ?? []}
                      isOwner={isOwner}
                      onRemoveTier={handleRemoveTier}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center text-sm text-muted-foreground/40">
                  {search ? `No players matching "${search}".` : "No ranked players yet."}
                </div>
              )
            ) : (
              tierCols.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {tierCols.map(col => (
                    <TierColumn key={col.tierNum} tierNum={col.tierNum} entries={col.entries} />
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center text-sm text-muted-foreground/40">
                  {search ? `No players matching "${search}".` : "No players ranked in this mode yet."}
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
