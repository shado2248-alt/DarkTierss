import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { TierBadge } from "@/components/ui/tier-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Trophy, Globe } from "lucide-react";
import { motion, useInView } from "framer-motion";

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

const EASE = [0.25, 0.1, 0.25, 1] as const;

const regionCls: Record<string, string> = {
  NA: "bg-red-500/20 text-red-300 border-red-500/30",
  EU: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  AS: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  OC: "bg-green-500/20 text-green-300 border-green-500/30",
  SA: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

const rankStyle: Record<number, { ring: string; badge: string; glow: string }> = {
  1: { ring: "border-yellow-400/60", badge: "from-yellow-500 to-amber-400 text-black", glow: "shadow-[0_0_20px_rgba(234,179,8,0.25)]" },
  2: { ring: "border-slate-400/60", badge: "from-slate-400 to-slate-300 text-black", glow: "shadow-[0_0_15px_rgba(148,163,184,0.2)]" },
  3: { ring: "border-orange-500/60", badge: "from-orange-600 to-orange-400 text-black", glow: "shadow-[0_0_15px_rgba(249,115,22,0.2)]" },
};

function RegionBadge({ region }: { region: string | null }) {
  if (!region) return null;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${regionCls[region] ?? "bg-white/10 text-white border-white/20"}`}>
      {region}
    </span>
  );
}

function PlayerCard({ player, index }: { player: OverallPlayer; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  const rs = rankStyle[player.rank];
  const bestMode = player.gamemodes.find(g => g.tierName);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3), ease: EASE }}
    >
      <Link href={`/players/${player.playerId}`}>
        <div className={`glass-card rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer group
          ${rs ? `${rs.ring} ${rs.glow} hover:border-yellow-400/80` : "border-white/10 hover:border-primary/50 hover:shadow-[0_0_16px_rgba(120,40,200,0.18)]"}`}>

          {/* Skin area */}
          <div className="relative flex items-end justify-center h-40 bg-gradient-to-b from-white/5 to-black/20 overflow-hidden">
            {rs && (
              <div className={`absolute inset-0 bg-gradient-to-b ${rs.badge.split(" ")[0]} opacity-10`} />
            )}
            <div className="absolute top-2 left-2 z-10">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black bg-gradient-to-br
                ${rs ? rs.badge : "from-white/15 to-white/5 text-white border border-white/20"}`}>
                {player.rank}
              </div>
            </div>
            <img
              src={`https://mc-heads.net/body/${player.uuid}/80`}
              alt={player.username}
              className="h-36 w-auto object-contain drop-shadow-lg z-10 group-hover:scale-105 transition-transform duration-300"
              onError={e => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/${player.uuid}/64`; }}
            />
          </div>

          {/* Info */}
          <div className="px-4 pt-3 pb-3.5 border-t border-white/5 bg-black/20">
            <div className="font-black text-sm text-white group-hover:text-primary transition-colors truncate mb-1.5">
              {player.username}
            </div>

            <div className="flex items-center gap-1.5 mb-2.5">
              <RegionBadge region={player.region} />
              <span className="text-[10px] text-muted-foreground">{player.rankedGamemodes} mode{player.rankedGamemodes !== 1 ? "s" : ""}</span>
            </div>

            {/* Best tier */}
            {bestMode ? (
              <div className="flex items-center justify-between">
                <TierBadge tierName={bestMode.tierName} tierColor={bestMode.tierColor} />
                <span className="text-[10px] text-muted-foreground font-mono">{bestMode.gamemodeName}</span>
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground/50">Unranked</div>
            )}

            {/* Overall ELO */}
            {player.overallScore > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Best ELO</span>
                <span className="text-xs font-black text-primary font-mono">{player.overallScore}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
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
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
        >
          <div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-violet-500">
              Players
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {data ? `${data.total} registered competitors` : "Browse all registered players."}
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              className="pl-9 bg-black/40 border-white/10 text-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: <Users className="w-3.5 h-3.5" />, label: "Total Players", value: data?.total ?? "—" },
            { icon: <Trophy className="w-3.5 h-3.5" />, label: "Ranked", value: filtered.filter(p => p.rankedGamemodes > 0).length || "—" },
            { icon: <Globe className="w-3.5 h-3.5" />, label: "Regions", value: new Set(filtered.map(p => p.region).filter(Boolean)).size || "—" },
          ].map(({ icon, label, value }) => (
            <div key={label} className="glass-card rounded-xl px-4 py-3 border border-white/10 flex items-center gap-3">
              <div className="text-primary">{icon}</div>
              <div>
                <div className="text-sm font-black text-white">{value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <Skeleton key={i} className="h-52 bg-white/5 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((player, i) => (
              <PlayerCard key={player.playerId} player={player} index={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-xl py-20 text-center text-muted-foreground"
          >
            No players found{search ? ` matching "${search}"` : ""}.
          </motion.div>
        )}

      </div>
    </div>
  );
}
