import { useState, useRef } from "react";
import { useGetLeaderboard, useListGamemodes } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { TierBadge } from "@/components/ui/tier-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";

const EASE = [0.25, 0.1, 0.25, 1] as const;

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

const REGION_CLS: Record<string, string> = {
  NA: "bg-red-500/20 text-red-300 border-red-500/30",
  EU: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  AS: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  OC: "bg-green-500/20 text-green-300 border-green-500/30",
  SA: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

function RegionBadge({ region }: { region: string | null }) {
  if (!region) return <span className="text-muted-foreground/30">—</span>;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${REGION_CLS[region] ?? "bg-white/10 text-white border-white/20"}`}>
      {region}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-black bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-[0_0_12px_rgba(234,179,8,0.5)]">1</span>;
  if (rank === 2) return <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-black bg-gradient-to-br from-slate-300 to-slate-400 text-black shadow-[0_0_8px_rgba(148,163,184,0.3)]">2</span>;
  if (rank === 3) return <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-black bg-gradient-to-br from-orange-400 to-orange-600 text-black shadow-[0_0_8px_rgba(249,115,22,0.3)]">3</span>;
  return <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-bold text-muted-foreground bg-white/5">{rank}</span>;
}

/* ─── Row: Overall Table ─────────────────────────────────── */
function OverallRow({ player, gamemodes, index }: {
  player: OverallPlayer;
  gamemodes: Array<{ id: number; name: string }>;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20px 0px" });
  const isTop3 = player.rank <= 3;

  return (
    <motion.tr
      ref={ref}
      initial={{ opacity: 0, x: -8 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3), ease: EASE }}
      className={`border-b border-white/5 transition-colors hover:bg-white/4 group
        ${isTop3 ? "bg-primary/4" : ""}`}
    >
      {/* Rank */}
      <td className="py-3 pl-4 pr-3 w-12">
        <RankBadge rank={player.rank} />
      </td>

      {/* Player */}
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <img
            src={`https://mc-heads.net/avatar/${player.uuid}/32`}
            alt={player.username}
            className="w-8 h-8 rounded-lg bg-black flex-shrink-0"
            onError={e => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/steve/32`; }}
          />
          <div className="min-w-0">
            <Link
              href={`/players/${player.playerId}`}
              className={`font-bold text-sm leading-tight block truncate hover:text-primary transition-colors
                ${isTop3 ? "text-white" : "text-white/90"}`}
            >
              {player.username}
            </Link>
            <div className="text-[10px] text-muted-foreground">{player.rankedGamemodes} mode{player.rankedGamemodes !== 1 ? "s" : ""}</div>
          </div>
        </div>
      </td>

      {/* Region */}
      <td className="py-3 pr-4">
        <RegionBadge region={player.region} />
      </td>

      {/* One column per gamemode */}
      {gamemodes.map(gm => {
        const entry = player.gamemodes.find(g => g.gamemodeId === gm.id);
        return (
          <td key={gm.id} className="py-3 pr-4 text-center">
            {entry?.tierName
              ? <TierBadge tierName={entry.tierName} tierColor={entry.tierColor} />
              : <span className="text-muted-foreground/25 text-xs">—</span>
            }
          </td>
        );
      })}

      {/* Best ELO */}
      <td className="py-3 pr-4 text-right">
        <span className={`font-black text-sm font-mono ${isTop3 ? "text-primary" : "text-white/70"}`}>
          {player.overallScore}
        </span>
      </td>
    </motion.tr>
  );
}

/* ─── Row: Per-Gamemode Table ────────────────────────────── */
function GamemodeRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20px 0px" });
  const isTop3 = entry.rank <= 3;
  const winPct = entry.totalMatches > 0 ? ((entry.wins / entry.totalMatches) * 100).toFixed(0) : "0";

  return (
    <motion.tr
      ref={ref}
      initial={{ opacity: 0, x: -8 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3), ease: EASE }}
      className={`border-b border-white/5 transition-colors hover:bg-white/4 group ${isTop3 ? "bg-primary/4" : ""}`}
    >
      <td className="py-3 pl-4 pr-3 w-12"><RankBadge rank={entry.rank} /></td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <img
            src={`https://mc-heads.net/avatar/${entry.uuid}/32`}
            alt={entry.username}
            className="w-8 h-8 rounded-lg bg-black flex-shrink-0"
            onError={e => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/steve/32`; }}
          />
          <Link href={`/players/${entry.playerId}`} className="font-bold text-sm text-white/90 hover:text-primary transition-colors truncate">
            {entry.username}
          </Link>
        </div>
      </td>
      <td className="py-3 pr-4"><RegionBadge region={entry.region} /></td>
      <td className="py-3 pr-4">
        {entry.tierName
          ? <TierBadge tierName={entry.tierName} tierColor={entry.tierColor} />
          : <span className="text-muted-foreground/40 text-xs">Unranked</span>}
      </td>
      <td className="py-3 pr-4 text-right">
        <span className={`font-black text-sm font-mono ${isTop3 ? "text-primary" : "text-white/80"}`}>{entry.rating}</span>
      </td>
      <td className="py-3 pr-4 text-center">
        <span className="text-xs font-semibold text-green-400">{entry.wins}</span>
      </td>
      <td className="py-3 pr-4 text-center">
        <span className="text-xs font-semibold text-red-400">{entry.losses}</span>
      </td>
      <td className="py-3 pr-5 text-right">
        <span className="text-xs font-bold text-muted-foreground">{winPct}%</span>
      </td>
    </motion.tr>
  );
}

/* ─── Table Shell ────────────────────────────────────────── */
function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="py-2.5 pr-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-left whitespace-nowrap select-none">
      {children}
    </th>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function Leaderboard() {
  const [view, setView] = useState<string>("overall");
  const [search, setSearch] = useState("");

  const { data: gamemodes } = useListGamemodes();

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
    { gamemodeId, search: search || undefined, sortBy: "rating", limit: 100 },
    { query: { enabled: view !== "overall" } as any }
  );

  const tabs = [
    { id: "overall", label: "Overall" },
    ...(gamemodes?.map(g => ({ id: g.id.toString(), label: g.name })) ?? []),
  ];

  const isLoading = view === "overall" ? overallLoading : tableLoading;
  const currentGamemodeName = gamemodes?.find(g => g.id.toString() === view)?.name;

  const filteredOverall = (overallData?.players ?? []).filter(p =>
    !search || p.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-screen-xl px-4 flex flex-col gap-5">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4"
        >
          <div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-violet-500">
              Leaderboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {view === "overall"
                ? `${overallData?.total ?? 0} ranked players across all gamemodes`
                : `${tableData?.total ?? 0} players in ${currentGamemodeName ?? "this mode"}`}
            </p>
          </div>
          <div className="relative w-full sm:w-56 flex-shrink-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search player..."
              className="pl-9 bg-black/40 border-white/10 text-white h-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none"
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setView(tab.id); setSearch(""); }}
              className={`relative px-4 py-2 rounded-lg text-xs font-bold flex-shrink-0 transition-colors duration-200
                ${view === tab.id ? "text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
            >
              {view === tab.id && (
                <motion.span
                  layoutId="lb-tab"
                  className="absolute inset-0 bg-primary/22 border border-primary/40 rounded-lg"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Table */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 bg-white/5 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="glass-card border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  {view === "overall" ? (
                    filteredOverall.length > 0 ? (
                      <table className="w-full min-w-max">
                        <thead className="border-b border-white/8 bg-black/30">
                          <tr>
                            <th className="py-2.5 pl-4 pr-3 w-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-left">#</th>
                            <TableHeader>Player</TableHeader>
                            <TableHeader>Region</TableHeader>
                            {(gamemodes ?? []).map(gm => (
                              <th key={gm.id} className="py-2.5 pr-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center whitespace-nowrap">
                                {gm.name}
                              </th>
                            ))}
                            <th className="py-2.5 pr-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right whitespace-nowrap">
                              Best ELO
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOverall.map((player, i) => (
                            <OverallRow
                              key={player.playerId}
                              player={player}
                              gamemodes={gamemodes ?? []}
                              index={i}
                            />
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-20 text-center text-muted-foreground">
                        {search ? `No players matching "${search}".` : "No ranked players yet."}
                      </div>
                    )
                  ) : (
                    tableData?.entries && tableData.entries.length > 0 ? (
                      <table className="w-full min-w-max">
                        <thead className="border-b border-white/8 bg-black/30">
                          <tr>
                            <th className="py-2.5 pl-4 pr-3 w-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-left">#</th>
                            <TableHeader>Player</TableHeader>
                            <TableHeader>Region</TableHeader>
                            <TableHeader>Tier</TableHeader>
                            <th className="py-2.5 pr-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">ELO</th>
                            <th className="py-2.5 pr-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">W</th>
                            <th className="py-2.5 pr-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">L</th>
                            <th className="py-2.5 pr-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">Win%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(tableData.entries as unknown as LeaderboardEntry[]).map((entry, i) => (
                            <GamemodeRow key={entry.playerId} entry={entry} index={i} />
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-20 text-center text-muted-foreground">
                        {search ? `No players matching "${search}".` : `No players ranked in ${currentGamemodeName ?? "this mode"} yet.`}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
