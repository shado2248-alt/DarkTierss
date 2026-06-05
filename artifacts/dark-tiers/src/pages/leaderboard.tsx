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

type ViewMode = "overall" | "all" | string; // string = gamemodeId

// Rank badge colors
const rankColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "from-yellow-500 to-amber-400", text: "text-black", border: "border-yellow-400" },
  2: { bg: "from-slate-400 to-slate-300", text: "text-black", border: "border-slate-400" },
  3: { bg: "from-orange-600 to-orange-400", text: "text-black", border: "border-orange-500" },
};
const defaultRank = { bg: "from-white/10 to-white/5", text: "text-white", border: "border-white/10" };

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
        tierSlug: string | null;
        rating: number | null;
      }>;
    }>;
    total: number;
  }>;
}

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

function OverallCard({ player, index }: { player: ReturnType<typeof fetchOverall> extends Promise<infer T> ? T extends { players: Array<infer P> } ? P : never : never; index: number }) {
  const rank = player.rank;
  const rc = rankColors[rank] ?? defaultRank;
  const rankedModes = player.gamemodes.filter(g => g.tierName);

  return (
    <motion.div
      variants={itemVariants}
      className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/40 transition-colors duration-300"
    >
      {/* Top banner: rank + skin + name */}
      <div className={`relative flex items-center gap-4 px-5 py-4 bg-gradient-to-r ${rank <= 3 ? rc.bg : "from-white/5 to-transparent"}`}>
        {/* Rank badge */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl bg-gradient-to-br ${rc.bg} ${rc.text} border ${rc.border} shadow-lg`}>
          {rank}
        </div>

        {/* Minecraft body skin */}
        <img
          src={`https://mc-heads.net/body/${player.uuid}/60`}
          alt={player.username}
          className="h-16 w-auto object-contain flex-shrink-0 drop-shadow-lg"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/${player.uuid}/60`; }}
        />

        {/* Name + region */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/players/${player.playerId}`}
            className={`font-black text-xl tracking-tight truncate block hover:text-primary transition-colors ${rank <= 3 ? rc.text : "text-white"}`}
          >
            {player.username}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              player.region === "NA"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : player.region === "EU"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-green-500/20 text-green-400 border border-green-500/30"
            }`}>
              {player.region}
            </span>
            <span className="text-xs text-muted-foreground">{player.rankedGamemodes} modes ranked</span>
          </div>
        </div>

        {/* Overall score */}
        {rank <= 3 && (
          <div className="flex-shrink-0 text-right hidden sm:block">
            <div className={`text-2xl font-black ${rank <= 3 ? rc.text : "text-primary"}`}>
              #{rank}
            </div>
          </div>
        )}
      </div>

      {/* Tiers row */}
      {rankedModes.length > 0 && (
        <div className="px-5 py-3 border-t border-white/5 bg-black/20">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Tiers</p>
          <div className="flex flex-wrap gap-2">
            {rankedModes.map(gm => (
              <div key={gm.gamemodeId} className="flex flex-col items-center gap-0.5">
                <TierBadge tierName={gm.tierName} tierColor={gm.tierColor} />
                <span className="text-[9px] text-muted-foreground">{gm.gamemodeName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Leaderboard() {
  const [view, setView] = useState<ViewMode>("overall");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "wins" | "matches">("rating");

  const { data: gamemodes } = useListGamemodes();

  // Overall leaderboard query
  const { data: overallData, isLoading: overallLoading } = useQuery({
    queryKey: ["leaderboard-overall"],
    queryFn: fetchOverall,
    enabled: view === "overall",
  });

  // Per-gamemode leaderboard
  const gamemodeId = view !== "overall" && view !== "all" ? parseInt(view) : undefined;
  const { data: tableData, isLoading: tableLoading } = useGetLeaderboard(
    {
      gamemodeId,
      search: search || undefined,
      sortBy,
      limit: 50,
    },
    { query: { enabled: view !== "overall" } }
  );

  const tabs: Array<{ id: ViewMode; label: string }> = [
    { id: "overall", label: "Overall" },
    { id: "all", label: "All Modes" },
    ...(gamemodes?.map(g => ({ id: g.id.toString(), label: g.name })) ?? []),
  ];

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-violet-500">
              Leaderboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {view === "overall" ? "Overall rankings across all gamemodes." : "Top players ranked by ELO."}
            </p>
          </div>

          {view !== "overall" && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
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
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setView(tab.id)}
              whileTap={{ scale: 0.95 }}
              className={`relative px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0 transition-colors duration-200 ${
                view === tab.id
                  ? "text-white"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              {view === tab.id && (
                <motion.span
                  layoutId="lb-tab-pill"
                  className="absolute inset-0 bg-primary/25 border border-primary/40 rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {view === "overall" ? (
            <motion.div
              key="overall"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {overallLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-40 bg-white/5 rounded-2xl" />
                  ))}
                </div>
              ) : overallData?.players && overallData.players.length > 0 ? (
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {overallData.players.map((player, idx) => (
                    <OverallCard key={player.playerId} player={player} index={idx} />
                  ))}
                </motion.div>
              ) : (
                <div className="glass-card rounded-xl py-20 text-center text-muted-foreground">
                  No ranked players yet. Create some matches to populate the leaderboard.
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="glass-card rounded-xl overflow-hidden border border-white/10"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-black/60 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-bold">Rank</th>
                      <th className="px-6 py-4 font-bold">Player</th>
                      <th className="px-6 py-4 font-bold">Tier</th>
                      <th className="px-6 py-4 font-bold text-right">Rating</th>
                      <th className="px-6 py-4 font-bold text-right hidden sm:table-cell">Win/Loss</th>
                      <th className="px-6 py-4 font-bold text-right hidden md:table-cell">Matches</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableLoading ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="px-6 py-4"><Skeleton className="h-4 w-6 bg-white/5" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-8 w-32 bg-white/5" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-6 w-12 bg-white/5" /></td>
                          <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto bg-white/5" /></td>
                          <td className="px-6 py-4 text-right hidden sm:table-cell"><Skeleton className="h-4 w-16 ml-auto bg-white/5" /></td>
                          <td className="px-6 py-4 text-right hidden md:table-cell"><Skeleton className="h-4 w-8 ml-auto bg-white/5" /></td>
                        </tr>
                      ))
                    ) : tableData?.entries && tableData.entries.length > 0 ? (
                      tableData.entries.map((entry, index) => {
                        const rc = rankColors[entry.rank] ?? defaultRank;
                        return (
                          <motion.tr
                            key={`${entry.playerId}-${index}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03, duration: 0.3 }}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm bg-gradient-to-br ${rc.bg} ${rc.text}`}>
                                {entry.rank}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Link href={`/players/${entry.playerId}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                                <img src={`https://mc-heads.net/avatar/${entry.uuid}/32`} alt={entry.username} className="w-8 h-8 rounded bg-black" />
                                <span className="font-bold text-white">{entry.username}</span>
                              </Link>
                            </td>
                            <td className="px-6 py-4">
                              <TierBadge tierName={entry.tierName} tierColor={entry.tierColor} />
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-primary">{entry.rating}</td>
                            <td className="px-6 py-4 text-right hidden sm:table-cell">
                              <span className="text-green-400 font-medium">{entry.wins}W</span>
                              <span className="text-muted-foreground mx-1">-</span>
                              <span className="text-red-400 font-medium">{entry.losses}L</span>
                            </td>
                            <td className="px-6 py-4 text-right text-muted-foreground hidden md:table-cell">{entry.totalMatches}</td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                          No players found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
