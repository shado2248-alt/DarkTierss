import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { TierBadge } from "@/components/ui/tier-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GamemodeIcon } from "@/lib/gamemode-icons";

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
  if (rank === 1) return <span className="inline-flex w-7 h-7 items-center justify-center rounded-md text-xs font-black bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.4)]">1</span>;
  if (rank === 2) return <span className="inline-flex w-7 h-7 items-center justify-center rounded-md text-xs font-black bg-gradient-to-br from-slate-300 to-slate-400 text-black">2</span>;
  if (rank === 3) return <span className="inline-flex w-7 h-7 items-center justify-center rounded-md text-xs font-black bg-gradient-to-br from-orange-400 to-orange-600 text-black">3</span>;
  return <span className="text-sm font-semibold text-muted-foreground tabular-nums">{rank}</span>;
}

function Th({ children, right, center }: { children: React.ReactNode; right?: boolean; center?: boolean }) {
  return (
    <th className={`px-3 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap select-none
      ${right ? "text-right" : center ? "text-center" : "text-left"}`}>
      {children}
    </th>
  );
}

export default function Players() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard-overall-players"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard/overall");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ players: OverallPlayer[]; total: number }>;
    },
  });

  const filtered = (data?.players ?? []).filter(p =>
    !search || p.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-screen-xl px-4 flex flex-col gap-0">

        {/* Header row */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Players</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {data ? `${data.total} registered competitors` : "Browse all registered players."}
            </p>
          </div>
          <div className="relative w-52 flex-shrink-0">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              className="pl-8 h-8 text-xs bg-card border-border/50 text-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Single tab (all players) */}
        <div className="flex items-end gap-0">
          <button className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-card border border-border/60 border-b-0 rounded-t-xl -mb-px z-10">
            <span className="text-base leading-none">👥</span>
            <span>All Players</span>
          </button>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key="players-table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="border border-border/60 bg-card rounded-b-xl rounded-tr-xl overflow-hidden"
          >
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 14 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 bg-white/4 rounded-lg" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="border-b border-white/8 bg-white/[0.02]">
                    <tr>
                      <Th center>#</Th>
                      <Th>Player</Th>
                      <Th>Region</Th>
                      <Th center>Modes</Th>
                      <Th>Best Tier</Th>
                      <Th right>Best ELO</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(player => {
                      const rankedModes = player.gamemodes.filter(g => g.tierName);
                      const bestMode = rankedModes.reduce<typeof rankedModes[0] | null>((best, g) => {
                        if (!best || (g.rating ?? 0) > (best.rating ?? 0)) return g;
                        return best;
                      }, null);
                      const bestElo = rankedModes.length
                        ? Math.max(...rankedModes.map(g => g.rating ?? 0))
                        : 0;

                      return (
                        <tr key={player.playerId} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                          <td className="px-3 py-3 w-10 text-center">
                            <RankNum rank={player.rank} />
                          </td>
                          <td className="px-3 py-3 min-w-[200px]">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={`https://mc-heads.net/avatar/${player.uuid}/28`}
                                alt={player.username}
                                className="w-7 h-7 rounded flex-shrink-0"
                                onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/28"; }}
                              />
                              <Link href={`/players/${player.playerId}`}
                                className="font-bold text-sm text-white hover:text-primary transition-colors">
                                {player.username}
                              </Link>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <RegionBadge region={player.region} />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="text-xs text-muted-foreground tabular-nums">{player.rankedGamemodes}</span>
                          </td>
                          <td className="px-3 py-3">
                            {bestMode?.tierName ? (
                              <div className="flex items-center gap-2">
                                <TierBadge tierName={bestMode.tierName} tierColor={bestMode.tierColor} />
                                <div className="flex items-center gap-1">
                                  <GamemodeIcon name={bestMode.gamemodeName} size={14} />
                                  <span className="text-[10px] text-muted-foreground/50">{bestMode.gamemodeName}</span>
                                </div>
                              </div>
                            ) : <span className="text-xs text-muted-foreground/40">Unranked</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-black text-sm font-mono tabular-nums ${player.rank <= 3 ? "text-primary" : "text-white/70"}`}>
                              {bestElo > 0 ? bestElo : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center text-sm text-muted-foreground">
                No players found{search ? ` matching "${search}"` : ""}.
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
