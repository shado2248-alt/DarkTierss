import { useState, useRef } from "react";
import { useListMatches, useListGamemodes } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Swords, Search, Filter } from "lucide-react";

const EASE = [0.25, 0.1, 0.25, 1] as const;

function ModeBadge({ name, color }: { name: string; color?: string }) {
  return (
    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
      {name}
    </span>
  );
}

function MatchCard({ match, index }: { match: any; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const winnerName = match.winnerId === match.player1Id ? match.player1Name : match.player2Name;
  const loserName  = match.winnerId === match.player1Id ? match.player2Name : match.player1Name;
  const winnerId   = match.winnerId === match.player1Id ? match.player1Id  : match.player2Id;
  const loserId    = match.winnerId === match.player1Id ? match.player2Id  : match.player1Id;
  const change     = Math.abs(match.ratingChange ?? 0);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.25), ease: EASE }}
      className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/40 transition-colors duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/30 border-b border-white/5">
        <ModeBadge name={match.gamemodeName} />
        <div className="flex items-center gap-2.5">
          {match.score && (
            <span className="font-mono text-xs font-bold text-white/50 bg-white/5 px-2 py-0.5 rounded">
              {match.score}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/70">
            {format(new Date(match.playedAt), "MMM d · HH:mm")}
          </span>
        </div>
      </div>

      {/* Players */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {/* Winner */}
        <div className="flex items-center gap-3 group/row">
          <div className="relative flex-shrink-0">
            <img
              src={`https://mc-heads.net/avatar/${encodeURIComponent(winnerName)}/36`}
              alt={winnerName}
              className="w-9 h-9 rounded-lg bg-black border border-white/10"
              onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/36"; }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-black" />
          </div>
          <Link href={`/players/${winnerId}`} className="flex-1 font-black text-sm text-green-400 hover:text-green-300 transition-colors truncate">
            {winnerName}
          </Link>
          <span className="text-[9px] font-black uppercase tracking-wider bg-green-500/15 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded flex-shrink-0">
            WIN
          </span>
          {change > 0 && (
            <span className="font-mono text-xs text-green-400 font-bold flex-shrink-0 w-12 text-right">
              +{change}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-px bg-white/5" />
          <Swords className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Loser */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <img
              src={`https://mc-heads.net/avatar/${encodeURIComponent(loserName)}/36`}
              alt={loserName}
              className="w-9 h-9 rounded-lg bg-black border border-white/10 opacity-60"
              onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/36"; }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-black" />
          </div>
          <Link href={`/players/${loserId}`} className="flex-1 font-medium text-sm text-red-400/70 hover:text-red-300 transition-colors truncate">
            {loserName}
          </Link>
          <span className="text-[9px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded flex-shrink-0">
            LOSS
          </span>
          {change > 0 && (
            <span className="font-mono text-xs text-red-400 font-bold flex-shrink-0 w-12 text-right">
              -{change}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Matches() {
  const [search, setSearch] = useState("");
  const [gamemodeId, setGamemodeId] = useState<number | null>(null);

  const { data: gamemodes } = useListGamemodes();
  const { data, isLoading } = useListMatches({ gamemodeId: gamemodeId ?? undefined, limit: 100 });

  const filtered = (data?.matches ?? []).filter(m =>
    !search || [m.player1Name, m.player2Name].some(n => n.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-violet-500">
            Match History
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data ? `${data.total} total matches${gamemodeId ? " in this mode" : " across all gamemodes"}` : "Recent battles across the platform."}
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.07 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Gamemode tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none flex-1">
            <button
              onClick={() => setGamemodeId(null)}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-colors duration-200 ${
                gamemodeId === null ? "text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              {gamemodeId === null && (
                <motion.span layoutId="match-tab" className="absolute inset-0 bg-primary/25 border border-primary/40 rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Filter className="w-3 h-3" />All Modes
              </span>
            </button>
            {gamemodes?.map(gm => (
              <button
                key={gm.id}
                onClick={() => setGamemodeId(gm.id)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-colors duration-200 ${
                  gamemodeId === gm.id ? "text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                {gamemodeId === gm.id && (
                  <motion.span layoutId="match-tab" className="absolute inset-0 bg-primary/25 border border-primary/40 rounded-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <span className="relative z-10">{gm.name}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64 flex-shrink-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search player..."
              className="pl-9 bg-black/40 border-white/10 text-white h-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-32 bg-white/5 rounded-2xl" />
              ))}
            </motion.div>
          ) : filtered.length > 0 ? (
            <motion.div key={`${gamemodeId}-${search}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((match, i) => (
                <MatchCard key={match.id} match={match} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="glass-card rounded-xl py-20 text-center text-muted-foreground">
              {search ? `No matches found with "${search}".` : "No matches yet."}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
