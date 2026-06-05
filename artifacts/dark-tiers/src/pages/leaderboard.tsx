import { useState } from "react";
import { useGetLeaderboard, useListGamemodes } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { TierBadge } from "@/components/ui/tier-badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "overall" | string; // string = gamemodeId

const rankColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "from-yellow-500 to-amber-400", text: "text-black", border: "border-yellow-400" },
  2: { bg: "from-slate-400 to-slate-300", text: "text-black", border: "border-slate-400" },
  3: { bg: "from-orange-600 to-orange-400", text: "text-black", border: "border-orange-500" },
};
const defaultRank = { bg: "from-white/10 to-white/5", text: "text-white", border: "border-white/20" };

async function fetchOverall() {
  const res = await fetch("/api/leaderboard/overall");
  if (!res.ok) throw new Error("Failed to fetch overall leaderboard");
  return res.json() as Promise<{
    players: Array<{
      rank: number;
      playerId: number;
      username: string;
      uuid: string;
      region: string;
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
    }>;
    total: number;
  }>;
}

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

type OverallPlayer = Awaited<ReturnType<typeof fetchOverall>>["players"][0];
type LeaderboardEntry = {
  rank: number;
  playerId: number;
  username: string;
  uuid: string;
  region: string;
  tierName: string | null;
  tierColor: string | null;
  rating: number;
  wins: number;
  losses: number;
  totalMatches: number;
};

function RegionBadge({ region }: { region: string | null }) {
  if (!region) return null;
  const cls =
    region === "NA"
      ? "bg-red-500/20 text-red-300 border-red-500/30"
      : region === "EU"
      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
      : "bg-green-500/20 text-green-300 border-green-500/30";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cls}`}>{region}</span>
  );
}

function OverallCard({ player }: { player: OverallPlayer }) {
  const rc = rankColors[player.rank] ?? defaultRank;
  const rankedModes = player.gamemodes.filter(g => g.tierName);
  const isTopThree = player.rank <= 3;

  return (
    <motion.div variants={cardVariants} className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/40 transition-colors duration-300">
      <div className={`flex items-center gap-3 px-4 py-3.5 ${isTopThree ? `bg-gradient-to-r ${rc.bg}` : "bg-white/5"}`}>
        <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg bg-gradient-to-br ${rc.bg} ${rc.text} border ${rc.border} shadow-md`}>
          {player.rank}
        </div>
        <img
          src={`https://mc-heads.net/body/${player.uuid}/60`}
          alt={player.username}
          className="h-14 w-auto object-contain flex-shrink-0 drop-shadow-md"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/${player.uuid}/48`; }}
        />
        <div className="flex-1 min-w-0">
          <Link href={`/players/${player.playerId}`} className={`font-black text-lg leading-tight truncate block hover:text-primary transition-colors ${isTopThree ? rc.text : "text-white"}`}>
            {player.username}
          </Link>
          <div className="flex items-center gap-1.5 mt-0.5">
            <RegionBadge region={player.region} />
            <span className="text-[10px] text-muted-foreground">{player.rankedGamemodes} modes</span>
          </div>
        </div>
      </div>
      {rankedModes.length > 0 && (
        <div className="px-4 py-3 border-t border-white/5 bg-black/20">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Tiers</p>
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {rankedModes.map(gm => (
              <div key={gm.gamemodeId} className="flex flex-col items-center gap-0.5">
                <TierBadge tierName={gm.tierName} tierColor={gm.tierColor} />
                <span className="text-[9px] text-muted-foreground leading-none">{gm.gamemodeName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function GamemodeCard({ entry }: { entry: LeaderboardEntry }) {
  const rc = rankColors[entry.rank] ?? defaultRank;
  const isTopThree = entry.rank <= 3;
  return (
    <motion.div variants={cardVariants} className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/40 transition-colors duration-300">
      <div className={`flex items-center gap-3 px-4 py-3.5 ${isTopThree ? `bg-gradient-to-r ${rc.bg}` : "bg-white/5"}`}>
        <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg bg-gradient-to-br ${rc.bg} ${rc.text} border ${rc.border} shadow-md`}>
          {entry.rank}
        </div>
        <img
          src={`https://mc-heads.net/body/${entry.uuid}/60`}
          alt={entry.username}
          className="h-14 w-auto object-contain flex-shrink-0 drop-shadow-md"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/${entry.uuid}/48`; }}
        />
        <div className="flex-1 min-w-0">
          <Link href={`/players/${entry.playerId}`} className={`font-black text-lg leading-tight truncate block hover:text-primary transition-colors ${isTopThree ? rc.text : "text-white"}`}>
            {entry.username}
          </Link>
          <div className="flex items-center gap-1.5 mt-0.5">
            <RegionBadge region={entry.region} />
            {entry.tierName && <TierBadge tierName={entry.tierName} tierColor={entry.tierColor} />}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`font-black text-xl ${isTopThree ? rc.text : "text-primary"}`}>{entry.rating}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            <span className="text-green-400">{entry.wins}W</span>
            <span className="mx-0.5 opacity-40">-</span>
            <span className="text-red-400">{entry.losses}L</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const [view, setView] = useState<ViewMode>("overall");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "wins" | "matches">("rating");

  const { data: gamemodes } = useListGamemodes();

  const { data: overallData, isLoading: overallLoading } = useQuery({
    queryKey: ["leaderboard-overall"],
    queryFn: fetchOverall,
    enabled: view === "overall",
  });

  const gamemodeId = view !== "overall" ? parseInt(view) : undefined;
  const { data: tableData, isLoading: tableLoading } = useGetLeaderboard(
    { gamemodeId, search: search || undefined, sortBy, limit: 50 },
    { query: { enabled: view !== "overall" } }
  );

  const tabs: Array<{ id: ViewMode; label: string }> = [
    { id: "overall", label: "Overall" },
    ...(gamemodes?.map(g => ({ id: g.id.toString(), label: g.name })) ?? []),
  ];

  const isLoading = view === "overall" ? overallLoading : tableLoading;

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-violet-500">
              Leaderboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {view === "overall"
                ? "Overall rankings across all gamemodes."
                : `Rankings for ${gamemodes?.find(g => g.id.toString() === view)?.name ?? "this gamemode"}.`}
            </p>
          </div>

          {view !== "overall" && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-56">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  className="pl-9 bg-black/40 border-white/10 text-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-32 bg-black/40 border-white/10 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="wins">Wins</SelectItem>
                  <SelectItem value="matches">Matches</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setView(tab.id)}
              whileTap={{ scale: 0.94 }}
              className={`relative px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0 transition-colors duration-200 ${
                view === tab.id ? "text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              {view === tab.id && (
                <motion.span
                  layoutId="lb-tab-pill"
                  className="absolute inset-0 bg-primary/25 border border-primary/40 rounded-lg"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 bg-white/5 rounded-2xl" />
                ))}
              </div>
            ) : view === "overall" ? (
              overallData?.players && overallData.players.length > 0 ? (
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {overallData.players.map(player => (
                    <OverallCard key={player.playerId} player={player} />
                  ))}
                </motion.div>
              ) : (
                <div className="glass-card rounded-xl py-20 text-center text-muted-foreground">
                  No ranked players yet. Create some matches to populate the leaderboard.
                </div>
              )
            ) : tableData?.entries && tableData.entries.length > 0 ? (
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {tableData.entries.map(entry => (
                  <GamemodeCard key={`${entry.playerId}`} entry={entry as unknown as LeaderboardEntry} />
                ))}
              </motion.div>
            ) : (
              <div className="glass-card rounded-xl py-20 text-center text-muted-foreground">
                No players ranked in this gamemode yet.
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
