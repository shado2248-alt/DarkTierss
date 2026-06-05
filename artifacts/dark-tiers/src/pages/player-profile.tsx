import { useGetPlayer } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { TierBadge } from "@/components/ui/tier-badge";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};
const rowVariant = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

export default function PlayerProfile() {
  const [, params] = useRoute("/players/:id");
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: player, isLoading } = useGetPlayer(id, { query: { enabled: !!id } });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center py-12">
        <div className="w-full max-w-7xl px-4 grid grid-cols-1 lg:grid-cols-4 gap-8">
          <Skeleton className="h-64 rounded-2xl bg-white/5" />
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Player not found.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center py-12">
      <div className="w-full max-w-7xl px-4 grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Sidebar */}
        <motion.div
          className="lg:col-span-1 flex flex-col gap-6"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div
            variants={fadeUp}
            className="glass-card rounded-2xl overflow-hidden border border-white/10"
          >
            <div className="relative flex flex-col items-center pt-6 pb-4 px-6">
              <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-primary/25 to-transparent" />
              <img
                src={`https://mc-heads.net/body/${player.uuid}/100`}
                alt={player.username}
                className="w-24 h-auto drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] z-10 mb-4"
              />
              <h1 className="text-2xl font-black text-white z-10">{player.username}</h1>
              <div className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mt-1 z-10">
                {player.region}{player.country ? ` · ${player.country}` : ""}
              </div>
              <div className="text-[10px] text-muted-foreground/50 font-mono mt-3 truncate w-full text-center z-10">
                {player.uuid}
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="glass-card p-6 rounded-2xl border border-white/10"
          >
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Stats Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Joined</span>
                <span className="text-sm font-medium">{format(new Date(player.createdAt), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Matches</span>
                <span className="text-sm font-bold text-white">
                  {player.ratings?.reduce((acc, r) => acc + r.totalMatches, 0) || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Gamemodes</span>
                <span className="text-sm font-bold text-white">{player.ratings?.length || 0}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Main content */}
        <div className="lg:col-span-3 flex flex-col gap-8">

          {/* Gamemode Ratings */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-xl font-bold text-white mb-4"
            >
              Gamemode Ratings
            </motion.h2>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {player.ratings?.map(rating => (
                <motion.div
                  key={rating.id}
                  variants={fadeUp}
                  className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/40 transition-colors duration-300"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 bg-black/30 border-b border-white/5">
                    <span className="font-bold text-sm text-white">{rating.gamemodeName}</span>
                    <TierBadge tierName={rating.tierName} tierColor={rating.tierColor} />
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-black text-primary leading-none">{rating.rating}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">ELO</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        <span className="text-green-400">{rating.wins}W</span>
                        <span className="text-muted-foreground mx-1">-</span>
                        <span className="text-red-400">{rating.losses}L</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Peak: <span className="text-white/60 font-mono">{rating.peakRating}</span></div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {(!player.ratings || player.ratings.length === 0) && (
                <motion.div
                  variants={fadeUp}
                  className="col-span-full py-8 text-center text-muted-foreground glass-card rounded-xl"
                >
                  No ratings yet.
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Recent Matches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-white mb-4">Recent Matches</h2>
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-muted-foreground uppercase tracking-widest bg-black/60 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 font-bold">Date</th>
                      <th className="px-4 py-3 font-bold">Mode</th>
                      <th className="px-4 py-3 font-bold">Result</th>
                      <th className="px-4 py-3 font-bold">Opponent</th>
                      <th className="px-4 py-3 font-bold text-right">Rating</th>
                    </tr>
                  </thead>
                  <motion.tbody variants={stagger} initial="hidden" animate="visible">
                    {player.recentMatches?.map(match => {
                      const isWinner = match.winnerId === player.id;
                      const opponent = match.player1Id === player.id ? match.player2Name : match.player1Name;
                      return (
                        <motion.tr
                          key={match.id}
                          variants={rowVariant}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {format(new Date(match.playedAt), "MMM d, HH:mm")}
                          </td>
                          <td className="px-4 py-3 font-medium text-xs">{match.gamemodeName}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                              isWinner
                                ? "bg-green-500/15 text-green-400 border-green-500/30"
                                : "bg-red-500/15 text-red-400 border-red-500/30"
                            }`}>
                              {isWinner ? "Victory" : "Defeat"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{opponent}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-sm">
                            {match.ratingChange != null ? (
                              <span className={match.ratingChange > 0 ? "text-green-400" : "text-red-400"}>
                                {match.ratingChange > 0 ? "+" : ""}{match.ratingChange}
                              </span>
                            ) : "-"}
                          </td>
                        </motion.tr>
                      );
                    })}
                    {(!player.recentMatches || player.recentMatches.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                          No recent matches.
                        </td>
                      </tr>
                    )}
                  </motion.tbody>
                </table>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
