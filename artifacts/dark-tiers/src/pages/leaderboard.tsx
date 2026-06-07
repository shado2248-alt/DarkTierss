import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { GamemodeIcon, trophyImg } from "@/lib/gamemode-icons";
import {
  fetchTierResults, deduplicateResults, deduplicateByPlayer,
  abbreviateRank, timeAgo, formatDate,
  RANK_COLOR, RANK_SCORE, REGION_CLS, type TierResult,
} from "@/lib/tierlist-api";

const GAMEMODES = ["Sword", "Axe", "SMP", "Crystal", "UHC", "DiaPot", "NethPot", "Mace"];

function RankBadge({ rank }: { rank: string }) {
  const color = RANK_COLOR[rank] ?? "#94a3b8";
  return (
    <span
      className="text-[11px] font-black px-2 py-0.5 rounded border flex-shrink-0"
      style={{ color, borderColor: `${color}50`, backgroundColor: `${color}18` }}
    >
      {abbreviateRank(rank)}
    </span>
  );
}

function RegionBadge({ region }: { region: string }) {
  if (!region) return null;
  const cls = REGION_CLS[region] ?? "text-white/50 border-white/20 bg-white/5";
  const label = region.length <= 2 ? region : region.slice(0, 2).toUpperCase();
  return (
    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border flex-shrink-0 ${cls}`}>
      {label}
    </span>
  );
}

function RowRank({ rank }: { rank: number }) {
  if (rank === 1) return <span className="flex-shrink-0 w-8 text-center font-black text-lg text-yellow-400 tabular-nums">1.</span>;
  if (rank === 2) return <span className="flex-shrink-0 w-8 text-center font-black text-lg text-slate-300 tabular-nums">2.</span>;
  if (rank === 3) return <span className="flex-shrink-0 w-8 text-center font-black text-lg text-orange-400 tabular-nums">3.</span>;
  return <span className="flex-shrink-0 w-8 text-center font-black text-sm text-muted-foreground/35 tabular-nums">{rank}.</span>;
}

function EntryRow({ entry, rank, showGamemode }: {
  entry: TierResult; rank: number; showGamemode: boolean;
}) {
  const rowBg =
    rank === 1 ? "bg-yellow-500/[0.09] hover:bg-yellow-500/[0.14]"
    : rank === 2 ? "bg-slate-400/[0.06] hover:bg-slate-400/[0.10]"
    : rank === 3 ? "bg-orange-700/[0.08] hover:bg-orange-700/[0.13]"
    : "hover:bg-white/[0.025]";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex items-center gap-3 px-4 py-3 transition-colors border-b border-white/[0.04] last:border-0 ${rowBg}`}
    >
      <RowRank rank={rank} />
      <img
        src={`https://mc-heads.net/avatar/${entry.username}/24`}
        alt={entry.username}
        className="w-6 h-6 rounded flex-shrink-0"
        onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/24"; }}
      />
      <span className="font-bold text-sm text-white flex-1 min-w-0 truncate">{entry.username}</span>
      <RankBadge rank={entry.rankEarned} />
      {showGamemode && (
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 w-[88px]">
          <GamemodeIcon name={entry.gamemode} size={13} />
          <span className="text-[11px] text-muted-foreground/60 font-semibold truncate">{entry.gamemode}</span>
        </div>
      )}
      <RegionBadge region={entry.region} />
      <span className="text-[11px] text-muted-foreground/35 flex-shrink-0 hidden sm:block w-14 text-right font-mono">
        {formatDate(entry.timestamp)}
      </span>
    </motion.div>
  );
}

function LivePill({ lastUpdated }: { lastUpdated: number | null }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest">
      <motion.span
        className="w-1.5 h-1.5 rounded-full bg-green-400"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      <span className="text-green-400">Live</span>
      {lastUpdated && (
        <span className="text-muted-foreground/30 font-normal normal-case tracking-normal ml-1">
          · synced {timeAgo(new Date(lastUpdated).toISOString())}
        </span>
      )}
    </div>
  );
}

export default function Leaderboard() {
  const [view, setView] = useState("overall");
  const [search, setSearch] = useState("");

  const { data: rawResults = [], isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["tierlist-external"],
    queryFn: fetchTierResults,
    refetchInterval: 10_000,
    staleTime: 9_000,
  });

  const deduped = deduplicateResults(rawResults);

  const overallEntries = deduplicateByPlayer(rawResults).filter(e =>
    !search || e.username.toLowerCase().includes(search.toLowerCase())
  );

  const gamemodeEntries = deduped
    .filter(e =>
      e.gamemode.toLowerCase() === view.toLowerCase() &&
      (!search || e.username.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => (RANK_SCORE[b.rankEarned] ?? 0) - (RANK_SCORE[a.rankEarned] ?? 0));

  const displayedEntries = view === "overall" ? overallEntries : gamemodeEntries;

  const tabs = [
    { id: "overall", label: "Overall" },
    ...GAMEMODES.map(g => ({ id: g, label: g })),
  ];
  const activeIdx = tabs.findIndex(t => t.id === view);

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-screen-xl px-4 flex flex-col gap-0">

        {/* Header */}
        <div className="flex items-end justify-between mb-5 gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-white tracking-tight">Rankings</h1>
              <LivePill lastUpdated={dataUpdatedAt ?? null} />
            </div>
            <p className="text-xs text-muted-foreground/50">
              {isLoading ? "Loading..." : (
                <>
                  {displayedEntries.length} player{displayedEntries.length !== 1 ? "s" : ""}
                  {view !== "overall" ? ` in ${view}` : " across all modes"}
                  {" · updated every 10s"}
                </>
              )}
            </p>
          </div>
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

        {/* Gamemode tabs */}
        <div className="flex items-end overflow-x-auto scrollbar-none gap-0.5">
          {tabs.map(tab => {
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setView(tab.id); setSearch(""); }}
                className={`relative flex-shrink-0 flex flex-col items-center gap-1.5 px-5 py-3 text-[11px] font-bold whitespace-nowrap transition-all rounded-t-xl -mb-px
                  ${active
                    ? "text-white bg-card border-2 border-border/60 z-10"
                    : "text-muted-foreground/50 hover:text-white/70"}`}
                style={active ? { borderBottomColor: "hsl(var(--card))" } : {}}
              >
                {tab.id === "overall"
                  ? <img src={trophyImg} alt="Overall" className="w-7 h-7 object-contain" />
                  : <GamemodeIcon name={tab.label} size={28} />}
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
            className={`border-2 border-border/60 bg-card overflow-hidden
              ${activeIdx === 0 ? "rounded-b-xl rounded-tr-xl" : "rounded-xl"}`}
          >
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.05] bg-black/25">
              <span className="w-8 flex-shrink-0 text-[9px] font-black uppercase tracking-widest text-muted-foreground/25">#</span>
              <span className="w-6 flex-shrink-0" />
              <span className="flex-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/25">Player</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/25">Rank Earned</span>
              {view === "overall" && (
                <span className="hidden sm:block w-[88px] text-[9px] font-black uppercase tracking-widest text-muted-foreground/25">Gamemode</span>
              )}
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/25">Region</span>
              <span className="hidden sm:block w-14 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground/25">Date</span>
            </div>

            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 bg-white/4 rounded-lg" />
                ))}
              </div>
            ) : displayedEntries.length > 0 ? (
              <div>
                <AnimatePresence>
                  {displayedEntries.map((entry, i) => (
                    <EntryRow
                      key={`${entry.username}::${entry.gamemode}::${entry.resultId}`}
                      entry={entry}
                      rank={i + 1}
                      showGamemode={view === "overall"}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="py-24 text-center text-sm text-muted-foreground/40">
                {search
                  ? `No players matching "${search}".`
                  : view === "overall"
                    ? "No ranked players yet."
                    : `No test results for ${view} yet.`}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
