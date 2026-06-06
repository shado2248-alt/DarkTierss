import { useState, Fragment } from "react";
import { useGetLeaderboard, useListGamemodes } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { TierBadge } from "@/components/ui/tier-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GamemodeIcon, trophyImg } from "@/lib/gamemode-icons";

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

const TIER_ORDER = ["HT1","LT1","HT2","LT2","HT3","LT3","HT4","LT4","HT5","LT5"];

const REGION_CLS: Record<string, string> = {
  NA: "text-red-400 border-red-500/40 bg-red-500/10",
  EU: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  AS: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
  OC: "text-green-400 border-green-500/40 bg-green-500/10",
  SA: "text-orange-400 border-orange-500/40 bg-orange-500/10",
};

function RegionBadge({ region }: { region: string | null }) {
  if (!region) return <span className="text-muted-foreground/30 text-xs">—</span>;
  return (
    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${REGION_CLS[region] ?? "bg-white/10 text-white border-white/20"}`}>
      {region}
    </span>
  );
}

function RankNum({ rank }: { rank: number }) {
  if (rank === 1) return (
    <span className="inline-flex w-7 h-7 items-center justify-center rounded text-xs font-black bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]">1</span>
  );
  if (rank === 2) return (
    <span className="inline-flex w-7 h-7 items-center justify-center rounded text-xs font-black bg-gradient-to-br from-slate-300 to-slate-400 text-black">2</span>
  );
  if (rank === 3) return (
    <span className="inline-flex w-7 h-7 items-center justify-center rounded text-xs font-black bg-gradient-to-br from-orange-400 to-orange-600 text-black">3</span>
  );
  return <span className="text-sm text-muted-foreground/60 tabular-nums font-medium">{rank}</span>;
}

function getBestElo(gamemodes: OverallPlayer["gamemodes"]): number {
  const ratings = gamemodes.map(g => g.rating).filter((r): r is number => r != null);
  return ratings.length ? Math.max(...ratings) : 0;
}

function Th({ children, right, center, className = "" }: { children: React.ReactNode; right?: boolean; center?: boolean; className?: string }) {
  return (
    <th className={`px-3 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 whitespace-nowrap select-none
      ${right ? "text-right" : center ? "text-center" : "text-left"} ${className}`}>
      {children}
    </th>
  );
}

/* Overall row — shows tier per gamemode */
function OverallRow({ player, gamemodes }: { player: OverallPlayer; gamemodes: Array<{ id: number; name: string }> }) {
  const bestElo = getBestElo(player.gamemodes);
  return (
    <tr className="border-b border-white/[0.05] hover:bg-white/[0.025] transition-colors">
      <td className="px-4 py-3 w-12 text-center"><RankNum rank={player.rank} /></td>
      <td className="px-3 py-3 min-w-[200px]">
        <div className="flex items-center gap-3">
          <img
            src={`https://mc-heads.net/avatar/${player.uuid}/28`}
            alt={player.username}
            className="w-7 h-7 rounded flex-shrink-0 image-render-pixel"
            onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/28"; }}
          />
          <div>
            <Link href={`/players/${player.playerId}`} className="font-bold text-sm text-white hover:text-primary transition-colors leading-tight block">
              {player.username}
            </Link>
            <span className="text-[10px] text-muted-foreground/40">{player.rankedGamemodes} mode{player.rankedGamemodes !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </td>
      <td className="px-3 py-3"><RegionBadge region={player.region} /></td>
      {gamemodes.map(gm => {
        const entry = player.gamemodes.find(g => g.gamemodeId === gm.id);
        return (
          <td key={gm.id} className="px-3 py-3 text-center">
            {entry?.tierName
              ? <TierBadge tierName={entry.tierName} tierColor={entry.tierColor} />
              : <span className="text-muted-foreground/15 text-xs">—</span>}
          </td>
        );
      })}
      <td className="px-4 py-3 text-right">
        <span className={`font-black text-sm font-mono tabular-nums ${player.rank <= 3 ? "text-primary" : "text-white/60"}`}>
          {bestElo > 0 ? bestElo : "—"}
        </span>
      </td>
    </tr>
  );
}

/* Tier section divider */
function TierDivider({ tierName, tierColor }: { tierName: string; tierColor?: string | null }) {
  const color = tierColor ?? "#888";
  return (
    <tr>
      <td colSpan={99} className="px-4 pt-5 pb-1">
        <div className="flex items-center gap-3">
          <span
            className="text-[11px] font-black tracking-widest uppercase px-3 py-1 rounded"
            style={{ color, background: `${color}18`, border: `1px solid ${color}40` }}
          >
            {tierName}
          </span>
          <div className="flex-1 h-px" style={{ background: `${color}20` }} />
        </div>
      </td>
    </tr>
  );
}

/* Per-gamemode row (inside a tier group) */
function GamemodeRow({ entry, localRank }: { entry: LeaderboardEntry; localRank: number }) {
  return (
    <tr className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors">
      <td className="px-4 py-2.5 w-12 text-center">
        <span className="text-xs text-muted-foreground/50 tabular-nums font-medium">{localRank}</span>
      </td>
      <td className="px-3 py-2.5 min-w-[200px]">
        <div className="flex items-center gap-3">
          <img
            src={`https://mc-heads.net/avatar/${entry.uuid}/28`}
            alt={entry.username}
            className="w-7 h-7 rounded flex-shrink-0"
            onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/28"; }}
          />
          <Link href={`/players/${entry.playerId}`} className="font-bold text-sm text-white hover:text-primary transition-colors">
            {entry.username}
          </Link>
        </div>
      </td>
      <td className="px-3 py-2.5">
        {entry.tierName
          ? <TierBadge tierName={entry.tierName} tierColor={entry.tierColor} />
          : <span className="text-muted-foreground/40 text-xs">Unranked</span>}
      </td>
      <td className="px-3 py-2.5"><RegionBadge region={entry.region} /></td>
      <td className="px-3 py-2.5 text-right">
        <span className="font-black text-sm font-mono tabular-nums text-white/70">{entry.rating}</span>
      </td>
      <td className="px-3 py-2.5 text-center">
        <span className="text-xs font-semibold text-green-400">{entry.wins}</span>
        <span className="text-muted-foreground/30 mx-1">/</span>
        <span className="text-xs font-semibold text-red-400">{entry.losses}</span>
      </td>
      <td className="px-4 py-2.5 text-right">
        <span className="text-xs font-bold text-muted-foreground/50 tabular-nums">
          {entry.totalMatches > 0 ? `${((entry.wins / entry.totalMatches) * 100).toFixed(0)}%` : "—"}
        </span>
      </td>
    </tr>
  );
}

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
    { gamemodeId, search: search || undefined, sortBy: "rating", limit: 200 },
    { query: { enabled: view !== "overall" } as any }
  );

  const tabs = [
    { id: "overall", label: "Overall", iconName: "overall" },
    ...(gamemodes?.map(g => ({ id: g.id.toString(), label: g.name, iconName: g.name })) ?? []),
  ];

  const isLoading = view === "overall" ? overallLoading : tableLoading;

  const filteredOverall = (overallData?.players ?? []).filter(p =>
    !search || p.username.toLowerCase().includes(search.toLowerCase())
  );

  const gamemodeEntries = (tableData?.entries ?? []) as unknown as LeaderboardEntry[];
  const filteredGamemode = gamemodeEntries.filter(e =>
    !search || e.username.toLowerCase().includes(search.toLowerCase())
  );

  /* Group per-gamemode entries by tier */
  const tierGroups = TIER_ORDER
    .map(tier => ({
      tier,
      color: filteredGamemode.find(e => e.tierName === tier)?.tierColor ?? null,
      entries: filteredGamemode.filter(e => e.tierName === tier),
    }))
    .filter(g => g.entries.length > 0);

  const activeIdx = tabs.findIndex(t => t.id === view);

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-screen-xl px-4 flex flex-col gap-0">

        {/* Header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Rankings</h1>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {view === "overall"
                ? `${overallData?.total ?? 0} players ranked across all modes`
                : `${tableData?.total ?? 0} players · ${tabs.find(t => t.id === view)?.label ?? ""}`}
            </p>
          </div>
          <div className="relative w-52 flex-shrink-0">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              placeholder="Search player..."
              className="pl-8 h-8 text-xs bg-card border-border/40 text-white placeholder:text-muted-foreground/40"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Gamemode tabs — floating above the card */}
        <div className="flex items-end overflow-x-auto scrollbar-none gap-0.5">
          {tabs.map((tab, i) => {
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setView(tab.id); setSearch(""); }}
                className={`relative flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold whitespace-nowrap transition-all rounded-t-lg -mb-px
                  ${active
                    ? "text-white bg-card border-2 border-border/60 border-b-card z-10"
                    : "text-muted-foreground/60 hover:text-white/80 bg-transparent"
                  }`}
                style={active ? { borderBottomColor: "hsl(var(--card))" } : {}}
              >
                {tab.id === "overall"
                  ? <img src={trophyImg} alt="Overall" className="w-[18px] h-[18px] object-contain" />
                  : <GamemodeIcon name={tab.label} size={18} />
                }
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Table card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className={`border-2 border-border/60 bg-card overflow-hidden
              ${activeIdx === 0 ? "rounded-b-xl rounded-tr-xl" : "rounded-xl"}`}
          >
            {isLoading ? (
              <div className="p-6 space-y-2">
                {Array.from({ length: 14 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 bg-white/4 rounded-lg" />
                ))}
              </div>
            ) : view === "overall" ? (
              /* ── OVERALL TABLE ── */
              filteredOverall.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead className="border-b-2 border-border/40">
                      <tr className="bg-white/[0.02]">
                        <Th center className="w-12">#</Th>
                        <Th>Player</Th>
                        <Th>Region</Th>
                        {(gamemodes ?? []).map(gm => (
                          <th key={gm.id} className="px-3 py-3 text-center whitespace-nowrap select-none">
                            <div className="flex flex-col items-center gap-1.5">
                              <GamemodeIcon name={gm.name} size={18} />
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{gm.name}</span>
                            </div>
                          </th>
                        ))}
                        <Th right>Peak ELO</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOverall.map(player => (
                        <OverallRow
                          key={player.playerId}
                          player={player}
                          gamemodes={gamemodes?.map(g => ({ id: g.id, name: g.name })) ?? []}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-24 text-center text-sm text-muted-foreground/40">
                  {search ? `No players matching "${search}".` : "No ranked players yet."}
                </div>
              )
            ) : (
              /* ── PER-GAMEMODE: TIER-GROUPED ── */
              filteredGamemode.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead className="border-b-2 border-border/40">
                      <tr className="bg-white/[0.02]">
                        <Th center className="w-12">#</Th>
                        <Th>Player</Th>
                        <Th>Tier</Th>
                        <Th>Region</Th>
                        <Th right>ELO</Th>
                        <Th center>W / L</Th>
                        <Th right>Win%</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {tierGroups.length > 0 ? (
                        tierGroups.map(group => (
                          <Fragment key={group.tier}>
                            <TierDivider tierName={group.tier} tierColor={group.color} />
                            {group.entries.map(entry => (
                              <GamemodeRow key={entry.playerId} entry={entry} localRank={entry.rank} />
                            ))}
                          </Fragment>
                        ))
                      ) : (
                        filteredGamemode.map(entry => (
                          <GamemodeRow key={entry.playerId} entry={entry} localRank={entry.rank} />
                        ))
                      )}
                    </tbody>
                  </table>
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
