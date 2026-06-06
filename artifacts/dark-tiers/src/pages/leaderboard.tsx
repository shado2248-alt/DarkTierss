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
  if (rank === 1) return <span className={`${base} text-yellow-400`}>{rank}.</span>;
  if (rank === 2) return <span className={`${base} text-slate-300`}>{rank}.</span>;
  if (rank === 3) return <span className={`${base} text-orange-400`}>{rank}.</span>;
  return <span className={`${base} text-muted-foreground/50`}>{rank}.</span>;
}

/* ── Overall player card (matches mctiers screenshot) ────── */
function PlayerCard({
  player,
  gamemodes,
}: {
  player: OverallPlayer;
  gamemodes: Array<{ id: number; name: string }>;
}) {
  const rankedGms = player.gamemodes.filter(g => g.tierName);
  const rankBg =
    player.rank === 1 ? "bg-yellow-500/10 border-yellow-500/30"
    : player.rank === 2 ? "bg-slate-400/10 border-slate-400/20"
    : player.rank === 3 ? "bg-orange-500/10 border-orange-500/20"
    : "bg-card border-border/40";

  return (
    <div className={`flex rounded-xl overflow-hidden border ${rankBg} transition-all hover:border-primary/40`}>
      {/* Left — rank + skin */}
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-4 min-w-[88px] bg-black/20 flex-shrink-0">
        <RankBadge rank={player.rank} />
        <img
          src={`https://mc-heads.net/body/${player.uuid}/80`}
          alt={player.username}
          className="h-20 w-auto object-contain"
          onError={e => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/${player.uuid}/64`; }}
        />
      </div>

      {/* Right — info + tiers */}
      <div className="flex-1 px-5 py-4 min-w-0">
        {/* Name + region */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href={`/players/${player.playerId}`}
            className="font-black text-lg text-white hover:text-primary transition-colors leading-tight truncate"
          >
            {player.username}
          </Link>
          <RegionBadge region={player.region} />
        </div>
        <p className="text-[11px] text-muted-foreground/50 mt-0.5">
          {rankedGms.length} mode{rankedGms.length !== 1 ? "s" : ""} ranked
        </p>

        {/* Tiers row */}
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
    <div className={`flex-1 min-w-[160px] rounded-xl border ${style.border} bg-card/60 overflow-hidden`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${style.border} bg-black/20`}>
        <div className="flex items-center gap-2">
          <img src={trophyImg} alt="Tier" className="w-5 h-5 object-contain opacity-80" style={{ filter: `drop-shadow(0 0 4px ${style.trophy})` }} />
          <span className={`font-black text-sm ${style.header}`}>Tier {tierNum}</span>
        </div>
      </div>
      {/* Player list */}
      <div className="divide-y divide-white/[0.04]">
        {entries.map(entry => (
          <div key={entry.playerId} className="flex items-center gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors">
            <img
              src={`https://mc-heads.net/avatar/${entry.uuid}/20`}
              alt={entry.username}
              className="w-5 h-5 rounded flex-shrink-0"
              onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/20"; }}
            />
            <Link
              href={`/players/${entry.playerId}`}
              className="text-[13px] font-semibold text-white/85 hover:text-primary transition-colors truncate flex-1"
            >
              {entry.username}
            </Link>
            {entry.region && <RegionBadge region={entry.region} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
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
    { gamemodeId, sortBy: "rating", limit: 500 },
    { query: { enabled: view !== "overall" } as any }
  );

  const tabs = [
    { id: "overall", label: "Overall" },
    ...(gamemodes?.map(g => ({ id: g.id.toString(), label: g.name })) ?? []),
  ];

  const isLoading = view === "overall" ? overallLoading : tableLoading;

  const filteredOverall = (overallData?.players ?? []).filter(p =>
    !search || p.username.toLowerCase().includes(search.toLowerCase())
  );

  /* Group per-gamemode entries into tier columns 1–5 */
  const gmEntries = (tableData?.entries ?? []) as unknown as LeaderboardEntry[];
  const filteredGm = gmEntries.filter(e =>
    !search || e.username.toLowerCase().includes(search.toLowerCase())
  );
  const tierCols = [1, 2, 3, 4, 5].map(n => ({
    tierNum: n,
    entries: filteredGm.filter(e => tierNumber(e.tierName) === n),
  })).filter(c => c.entries.length > 0);

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
              /* ── OVERALL: card list ── */
              filteredOverall.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {filteredOverall.map(player => (
                    <PlayerCard
                      key={player.playerId}
                      player={player}
                      gamemodes={gamemodes?.map(g => ({ id: g.id, name: g.name })) ?? []}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center text-sm text-muted-foreground/40">
                  {search ? `No players matching "${search}".` : "No ranked players yet."}
                </div>
              )
            ) : (
              /* ── PER-GAMEMODE: tier columns ── */
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
