import { useState } from "react";
import { useGetPlayer, useGetMe, useClaimPlayer } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { TierBadge } from "@/components/ui/tier-badge";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Trophy, Swords, Star, TrendingUp, Shield, Zap, Award, ShieldCheck, Flame } from "lucide-react";

// ── Achievement definitions ───────────────────────────────────────────────────
interface AchievementDef {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: "first_match", label: "First Blood", desc: "Played first match", icon: <Swords className="w-3.5 h-3.5" />, color: "text-orange-400 bg-orange-500/15 border-orange-500/30" },
  { id: "veteran", label: "Veteran", desc: "50+ matches played", icon: <Shield className="w-3.5 h-3.5" />, color: "text-blue-400 bg-blue-500/15 border-blue-500/30" },
  { id: "warrior", label: "Warrior", desc: "100+ matches played", icon: <Star className="w-3.5 h-3.5" />, color: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30" },
  { id: "legend", label: "Legend", desc: "200+ matches played", icon: <Trophy className="w-3.5 h-3.5" />, color: "text-amber-400 bg-amber-500/15 border-amber-500/30" },
  { id: "high_elo", label: "High Elo", desc: "Reached 2000+ rating", icon: <TrendingUp className="w-3.5 h-3.5" />, color: "text-purple-400 bg-purple-500/15 border-purple-500/30" },
  { id: "elite", label: "Elite", desc: "Reached 2400+ rating", icon: <Zap className="w-3.5 h-3.5" />, color: "text-primary bg-primary/15 border-primary/30" },
  { id: "dominant", label: "Dominant", desc: "70%+ win rate (20+ games)", icon: <Award className="w-3.5 h-3.5" />, color: "text-green-400 bg-green-500/15 border-green-500/30" },
  { id: "versatile", label: "Versatile", desc: "Active in 4+ gamemodes", icon: <Star className="w-3.5 h-3.5" />, color: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30" },
];

function computeAchievements(player: any): Set<string> {
  const earned = new Set<string>();
  const ratings = player.ratings ?? [];
  const totalMatches = ratings.reduce((a: number, r: any) => a + r.totalMatches, 0);
  const totalWins = ratings.reduce((a: number, r: any) => a + r.wins, 0);
  const bestRating = ratings.reduce((a: number, r: any) => Math.max(a, r.peakRating ?? r.rating), 0);
  const winRate = totalMatches > 0 ? totalWins / totalMatches : 0;

  if (totalMatches >= 1) earned.add("first_match");
  if (totalMatches >= 50) earned.add("veteran");
  if (totalMatches >= 100) earned.add("warrior");
  if (totalMatches >= 200) earned.add("legend");
  if (bestRating >= 2000) earned.add("high_elo");
  if (bestRating >= 2400) earned.add("elite");
  if (winRate >= 0.7 && totalMatches >= 20) earned.add("dominant");
  if (ratings.length >= 4) earned.add("versatile");

  return earned;
}

// ── Rating history graph ──────────────────────────────────────────────────────
function buildRatingHistory(matches: any[], playerId: number, gamemodeId: number, currentRating: number) {
  const gmMatches = (matches ?? [])
    .filter((m: any) => m.gamemodeId === gamemodeId)
    .slice()
    .reverse(); // oldest first

  if (gmMatches.length === 0) return [];

  const changes = gmMatches.map((m: any) => {
    const change = m.ratingChange ?? 0;
    return m.winnerId === playerId ? change : -change;
  });
  const totalChange = changes.reduce((a: number, b: number) => a + b, 0);

  let rating = currentRating - totalChange;
  return gmMatches.map((m: any, i: number) => {
    rating += changes[i];
    return {
      label: format(new Date(m.playedAt), "MM/dd"),
      rating,
      result: m.winnerId === playerId ? "W" : "L",
    };
  });
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export default function PlayerProfile() {
  const [, params] = useRoute("/players/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: player, isLoading } = useGetPlayer(id, { query: { enabled: !!id } as any });
  const { data: me } = useGetMe();
  const claimPlayer = useClaimPlayer();
  const qc = useQueryClient();
  const [graphGamemode, setGraphGamemode] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center py-12">
        <div className="w-full max-w-7xl px-4 grid grid-cols-1 lg:grid-cols-4 gap-8">
          <Skeleton className="h-96 rounded-2xl bg-white/5" />
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl bg-white/5" />)}
            </div>
            <Skeleton className="h-64 rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!player) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Player not found.</div>;
  }

  const ratings = player.ratings ?? [];
  const recentMatches = player.recentMatches ?? [];
  const totalMatches = ratings.reduce((a: number, r: any) => a + r.totalMatches, 0);
  const totalWins = ratings.reduce((a: number, r: any) => a + r.wins, 0);
  const totalLosses = ratings.reduce((a: number, r: any) => a + r.losses, 0);
  const bestRating = ratings.reduce((a: number, r: any) => Math.max(a, r.rating), 0);
  const bestPeak = ratings.reduce((a: number, r: any) => Math.max(a, r.peakRating ?? r.rating), 0);
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
  const bestTierRating = ratings.reduce<any>((best, r: any) => !best || r.rating > best.rating ? r : best, null);

  const earned = computeAchievements(player);

  // Claim logic
  const canClaim = me && !(player as any).userId && !(player as any).isVerified;
  const isOwn = me && (player as any).userId && String((player as any).userId) === String((me as any).id);
  const handleClaim = async () => {
    setClaiming(true); setClaimMsg(null);
    try {
      await claimPlayer.mutateAsync({ id } as any);
      qc.invalidateQueries();
      setClaimMsg({ ok: true, text: "Profile claimed! You are now verified." });
    } catch (err: any) {
      setClaimMsg({ ok: false, text: err?.response?.data?.error ?? err?.message ?? "Failed to claim" });
    } finally { setClaiming(false); }
  };

  // Best streak across all gamemodes
  const bestCurrentStreak = ratings.reduce((a: number, r: any) => Math.max(a, r.currentStreak ?? 0), 0);
  const bestMaxStreak = ratings.reduce((a: number, r: any) => Math.max(a, r.maxStreak ?? 0), 0);

  // Default graph gamemode to first one with matches
  const activeGmId = graphGamemode ?? (ratings.find((r: any) => r.totalMatches > 0)?.gamemodeId ?? null);
  const activeRating = ratings.find((r: any) => r.gamemodeId === activeGmId);
  const historyData = activeGmId && activeRating
    ? buildRatingHistory(recentMatches, player.id, activeGmId, activeRating.rating)
    : [];

  return (
    <div className="flex-1 flex flex-col items-center py-12">
      <div className="w-full max-w-7xl px-4 grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* ── Sidebar ── */}
        <motion.div className="lg:col-span-1 flex flex-col gap-5" initial="hidden" animate="visible" variants={stagger}>

          {/* Avatar card */}
          <motion.div variants={fadeUp} className="glass-card rounded-2xl overflow-hidden border border-white/10">
            <div className="relative flex flex-col items-center pt-6 pb-5 px-6">
              <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-primary/30 to-transparent" />
              <img src={`https://mc-heads.net/body/${player.uuid}/100`} alt={player.username} className="w-24 h-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] z-10 mb-4" />
              <h1 className="text-2xl font-black text-white z-10 flex items-center gap-2">
                {player.username}
                {(player as any).isVerified && (
                  <span title="Verified account" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40">
                    <ShieldCheck className="w-3 h-3 text-green-400" />
                  </span>
                )}
                {isOwn && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/15 border border-primary/30 px-1.5 py-0.5 rounded-full">You</span>
                )}
              </h1>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-1 z-10">
                {player.region}{player.country ? ` · ${player.country}` : ""}
              </div>
              {bestTierRating && (
                <div className="mt-3 z-10">
                  <TierBadge tierName={bestTierRating.tierName} tierColor={bestTierRating.tierColor} />
                </div>
              )}
              {/* Claim button */}
              {canClaim && (
                <div className="mt-3 z-10 w-full flex flex-col items-center gap-2">
                  <button onClick={handleClaim} disabled={claiming}
                    className="flex items-center gap-2 text-xs font-bold bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary px-4 py-2 rounded-lg transition-all w-full justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {claiming ? "Claiming..." : "Claim this profile"}
                  </button>
                  {claimMsg && (
                    <span className={`text-[11px] font-semibold ${claimMsg.ok ? "text-green-400" : "text-red-400"}`}>{claimMsg.text}</span>
                  )}
                </div>
              )}
              <div className="text-[10px] text-muted-foreground/40 font-mono mt-3 truncate w-full text-center z-10">{player.uuid}</div>
            </div>
          </motion.div>

          {/* Stats overview */}
          <motion.div variants={fadeUp} className="glass-card p-5 rounded-2xl border border-white/10">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Stats Overview</h3>
            <div className="space-y-3">
              {[
                { label: "Joined", value: format(new Date(player.createdAt), "MMM d, yyyy") },
                { label: "Total Matches", value: totalMatches, bold: true },
                { label: "Win / Loss", value: `${totalWins}W · ${totalLosses}L`, bold: true },
                { label: "Win Rate", value: `${winRate}%`, color: winRate >= 60 ? "text-green-400" : winRate >= 40 ? "text-white" : "text-red-400" },
                { label: "Best Rating", value: bestRating, bold: true, color: "text-primary" },
                { label: "Peak Rating", value: bestPeak, bold: true },
                { label: "Gamemodes", value: ratings.length },
                ...(bestCurrentStreak > 1 ? [{ label: "Win Streak", value: `${bestCurrentStreak}x`, bold: true, color: "text-orange-400" }] : []),
                ...(bestMaxStreak > 0 ? [{ label: "Best Streak", value: `${bestMaxStreak}x`, bold: false, color: "text-muted-foreground" }] : []),
              ].map(({ label, value, bold, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className={`text-sm ${bold ? "font-bold text-white" : "font-medium"} ${color ?? ""}`}>{value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div variants={fadeUp} className="glass-card p-5 rounded-2xl border border-white/10">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Achievements</h3>
            <div className="flex flex-wrap gap-2">
              {ACHIEVEMENT_DEFS.map(a => (
                <div
                  key={a.id}
                  title={a.desc}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all duration-200 ${
                    earned.has(a.id) ? a.color : "text-white/20 bg-white/5 border-white/10 grayscale"
                  }`}
                >
                  {a.icon}
                  <span>{a.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Main content ── */}
        <div className="lg:col-span-3 flex flex-col gap-8">

          {/* Gamemode Ratings */}
          <div>
            <motion.h2 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="text-xl font-bold text-white mb-4">
              Gamemode Ratings
            </motion.h2>
            <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ratings.map((rating: any) => (
                <motion.div
                  key={rating.id}
                  variants={fadeUp}
                  className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/40 transition-colors duration-300"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 bg-black/30 border-b border-white/5">
                    <span className="font-bold text-sm text-white">{rating.gamemodeName}</span>
                    <TierBadge tierName={rating.tierName} tierColor={rating.tierColor} />
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <div className="text-3xl font-black text-primary leading-none">{rating.rating}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">ELO</div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <div className="text-sm font-semibold">
                          <span className="text-green-400">{rating.wins}W</span>
                          <span className="text-muted-foreground mx-1">-</span>
                          <span className="text-red-400">{rating.losses}L</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Peak: <span className="text-white/60 font-mono">{rating.peakRating}</span>
                        </div>
                        {(rating.currentStreak ?? 0) > 1 && (
                          <div className="flex items-center gap-1 text-[10px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/25 rounded px-1.5 py-0.5">
                            <Flame className="w-3 h-3" />{rating.currentStreak}W streak
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Win rate bar */}
                    {rating.totalMatches > 0 && (
                      <div className="mt-2">
                        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500"
                            style={{ width: `${Math.round((rating.wins / rating.totalMatches) * 100)}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-1 text-right">
                          {Math.round((rating.wins / rating.totalMatches) * 100)}% win rate · {rating.totalMatches} games
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {ratings.length === 0 && (
                <motion.div variants={fadeUp} className="col-span-full py-8 text-center text-muted-foreground glass-card rounded-xl">
                  No ratings yet.
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Rating Progress Graph */}
          {ratings.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Rating Progress</h2>
                <div className="flex gap-1">
                  {ratings.map((r: any) => (
                    <button
                      key={r.gamemodeId}
                      onClick={() => setGraphGamemode(r.gamemodeId)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 ${
                        (activeGmId === r.gamemodeId)
                          ? "bg-primary/30 text-white border border-primary/50"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {r.gamemodeName}
                    </button>
                  ))}
                </div>
              </div>
              <div className="glass-card p-5 rounded-2xl border border-white/10">
                {historyData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={historyData}>
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#666" }} />
                      <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#666" }} width={45} />
                      <Tooltip
                        contentStyle={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                        formatter={(val: any, _name: any, props: any) => [`${val} ELO (${props.payload.result})`, "Rating"]}
                      />
                      <ReferenceLine y={activeRating?.rating} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="rating" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                    {historyData.length === 0 ? "No match history available for this gamemode." : "Play more matches to see rating progress."}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Recent Matches */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
            <h2 className="text-xl font-bold text-white mb-4">Recent Matches</h2>
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-muted-foreground uppercase tracking-widest bg-black/60 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">Result</th>
                      <th className="px-4 py-3">Opponent</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3 text-right">Rating</th>
                    </tr>
                  </thead>
                  <motion.tbody variants={stagger} initial="hidden" animate="visible">
                    {recentMatches.map((match: any) => {
                      const isWinner = match.winnerId === player.id;
                      const opponent = match.player1Id === player.id ? match.player2Name : match.player1Name;
                      return (
                        <motion.tr key={match.id} variants={fadeUp} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(match.playedAt), "MMM d, HH:mm")}</td>
                          <td className="px-4 py-3 font-medium text-xs text-primary">{match.gamemodeName}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                              isWinner ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"
                            }`}>
                              {isWinner ? "Victory" : "Defeat"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{opponent}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{match.score}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-sm">
                            {match.ratingChange != null ? (
                              <span className={isWinner ? "text-green-400" : "text-red-400"}>
                                {isWinner ? "+" : "-"}{Math.abs(match.ratingChange)}
                              </span>
                            ) : "-"}
                          </td>
                        </motion.tr>
                      );
                    })}
                    {recentMatches.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No recent matches.</td></tr>
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
