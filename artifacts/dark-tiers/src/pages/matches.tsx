import { useListMatches } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Swords } from "lucide-react";

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
};

function ModeBadge({ name }: { name: string }) {
  return (
    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
      {name}
    </span>
  );
}

export default function Matches() {
  const { data, isLoading } = useListMatches({ limit: 50 });

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-violet-500">
            Match History
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Recent battles across the platform.</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-32 bg-white/5 rounded-2xl" />
            ))}
          </div>
        ) : data?.matches && data.matches.length > 0 ? (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {data.matches.map((match) => {
              const winnerId = match.winnerId === match.player1Id ? match.player1Id : match.player2Id;
              const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
              const winnerName = match.winnerId === match.player1Id ? match.player1Name : match.player2Name;
              const loserName = match.winnerId === match.player1Id ? match.player2Name : match.player1Name;

              return (
                <motion.div
                  key={match.id}
                  variants={cardVariants}
                  className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/40 transition-colors duration-300"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-black/30 border-b border-white/5">
                    <ModeBadge name={match.gamemodeName} />
                    <div className="flex items-center gap-3">
                      {match.score && (
                        <span className="font-mono text-sm font-bold text-white/60">{match.score}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(match.playedAt), "MMM d, HH:mm")}
                      </span>
                    </div>
                  </div>

                  {/* Players */}
                  <div className="px-4 py-3 flex flex-col gap-2">
                    {/* Winner */}
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://mc-heads.net/avatar/${encodeURIComponent(winnerName)}/32`}
                        alt={winnerName}
                        className="w-8 h-8 rounded bg-black flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/32"; }}
                      />
                      <Link
                        href={`/players/${winnerId}`}
                        className="flex-1 font-black text-sm text-green-400 hover:text-green-300 transition-colors truncate"
                      >
                        {winnerName}
                      </Link>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5 rounded flex-shrink-0">
                        WIN
                      </span>
                      {match.ratingChange != null && (
                        <span className="font-mono text-xs text-green-400 font-bold flex-shrink-0">
                          +{Math.abs(match.ratingChange)}
                        </span>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-2 px-1">
                      <div className="flex-1 h-px bg-white/5" />
                      <Swords className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
                      <div className="flex-1 h-px bg-white/5" />
                    </div>

                    {/* Loser */}
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://mc-heads.net/avatar/${encodeURIComponent(loserName)}/32`}
                        alt={loserName}
                        className="w-8 h-8 rounded bg-black flex-shrink-0 opacity-60"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/32"; }}
                      />
                      <Link
                        href={`/players/${loserId}`}
                        className="flex-1 font-medium text-sm text-red-400 hover:text-red-300 transition-colors truncate opacity-80"
                      >
                        {loserName}
                      </Link>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded flex-shrink-0">
                        LOSS
                      </span>
                      {match.ratingChange != null && (
                        <span className="font-mono text-xs text-red-400 font-bold flex-shrink-0">
                          -{Math.abs(match.ratingChange)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-xl py-20 text-center text-muted-foreground"
          >
            No matches found.
          </motion.div>
        )}
      </div>
    </div>
  );
}
