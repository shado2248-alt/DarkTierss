import { useGetStats, useGetRecentActivity, useListAnnouncements, useGetLeaderboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { TierBadge } from "../components/ui/tier-badge";
import { motion } from "framer-motion";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut", delay: i * 0.1 },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const rowVariant = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function Home() {
  const { data: stats } = useGetStats();
  const { data: activity } = useGetRecentActivity();
  const { data: announcements } = useListAnnouncements({ params: { limit: 3 } });
  const { data: leaderboard } = useGetLeaderboard({ params: { limit: 5 } });

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">

        {/* Hero */}
        <motion.header
          className="text-center space-y-6"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.h1
            variants={fadeUp}
            className="text-6xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-purple-300"
          >
            DARK TIERS
          </motion.h1>
          <motion.p variants={fadeUp} className="text-muted-foreground text-xl max-w-2xl mx-auto">
            The elite Minecraft PvP ranking platform. Track your rating, climb the tiers, and prove your dominance.
          </motion.p>
          <motion.div variants={fadeUp} className="flex gap-4 justify-center pt-2 flex-wrap">
            <Link
              href="/leaderboard"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-md font-semibold transition-all shadow-[0_0_20px_rgba(120,40,200,0.35)] hover:shadow-[0_0_30px_rgba(120,40,200,0.55)] hover:-translate-y-0.5"
            >
              View Leaderboard
            </Link>
            <a
              href="https://discord.gg/"
              target="_blank"
              rel="noreferrer"
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-3 rounded-md font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(88,101,242,0.4)]"
            >
              Join Discord
            </a>
          </motion.div>
        </motion.header>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          {[
            { value: stats?.totalPlayers ?? 0, label: "Ranked Players" },
            { value: stats?.totalMatches ?? 0, label: "Matches Played" },
            { value: stats?.totalTests ?? 0, label: "Tier Tests" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              custom={i}
              variants={fadeUp}
              className="glass-card p-8 rounded-xl flex flex-col items-center gap-2 border border-white/10 hover:border-primary/30 transition-colors"
            >
              <span className="text-5xl font-bold text-white">{item.value}</span>
              <span className="text-sm text-muted-foreground uppercase tracking-widest">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Top Ranked + Recent Matches */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <motion.div
            className="glass-card rounded-xl overflow-hidden border border-white/10"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4 }}
          >
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bold text-white text-lg">Top Ranked</h2>
              <Link href="/leaderboard" className="text-sm text-primary hover:text-primary/80 transition-colors">View All</Link>
            </div>
            <motion.div className="divide-y divide-white/5" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {leaderboard?.entries?.map((entry, i) => (
                <motion.div key={entry.playerId} variants={rowVariant} className="px-6 py-3 flex items-center gap-4 hover:bg-white/5 transition-colors">
                  <span className="text-muted-foreground text-sm w-6 text-center font-mono">#{i + 1}</span>
                  <img
                    src={`https://mc-heads.net/avatar/${entry.uuid}/32`}
                    alt={entry.username}
                    className="w-8 h-8 rounded"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/32"; }}
                  />
                  <Link href={`/players/${entry.playerId}`} className="flex-1 font-medium text-white hover:text-primary transition-colors text-sm">
                    {entry.username}
                  </Link>
                  <TierBadge tierName={entry.tierName ?? null} tierColor={entry.tierColor ?? null} />
                  <span className="text-primary font-mono text-sm font-bold">{entry.rating}</span>
                </motion.div>
              ))}
              {(!leaderboard?.entries || leaderboard.entries.length === 0) && (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">No ranked players yet.</div>
              )}
            </motion.div>
          </motion.div>

          <motion.div
            className="glass-card rounded-xl overflow-hidden border border-white/10"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bold text-white text-lg">Recent Matches</h2>
              <Link href="/matches" className="text-sm text-primary hover:text-primary/80 transition-colors">View All</Link>
            </div>
            <motion.div className="divide-y divide-white/5" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {activity?.recentMatches?.map((match) => (
                <motion.div key={match.id} variants={rowVariant} className="px-6 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                  <span className="text-xs text-muted-foreground w-14 flex-shrink-0 font-medium">{match.gamemodeName}</span>
                  <span className="text-green-400 font-semibold text-sm flex-1 truncate">
                    {match.player1Id === match.winnerId ? match.player1Name : match.player2Name}
                  </span>
                  <span className="text-muted-foreground text-xs">vs</span>
                  <span className="text-red-400 font-semibold text-sm flex-1 text-right truncate">
                    {match.player1Id === match.winnerId ? match.player2Name : match.player1Name}
                  </span>
                  {match.ratingChange != null && (
                    <span className="text-xs text-primary font-mono font-bold w-10 text-right flex-shrink-0">
                      +{match.ratingChange}
                    </span>
                  )}
                </motion.div>
              ))}
              {(!activity?.recentMatches || activity.recentMatches.length === 0) && (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">No recent matches.</div>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Promotions + Announcements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <motion.div
            className="glass-card rounded-xl overflow-hidden border border-white/10"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4 }}
          >
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-bold text-white text-lg">Recent Promotions</h2>
            </div>
            <motion.div className="divide-y divide-white/5" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {activity?.recentPromotions?.map((promo) => (
                <motion.div key={promo.id} variants={rowVariant} className="px-6 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                  <Link href={`/players/${promo.playerId}`} className="font-medium text-white hover:text-primary transition-colors text-sm flex-1 truncate">
                    {promo.playerName}
                  </Link>
                  <span className="text-muted-foreground text-xs flex-shrink-0">{promo.gamemodeName}</span>
                  <span className="text-muted-foreground text-xs flex-shrink-0">promoted to</span>
                  <TierBadge tierName={promo.toTier} tierColor="#9333ea" />
                  <span className="text-muted-foreground text-xs flex-shrink-0">{formatDate(promo.promotedAt)}</span>
                </motion.div>
              ))}
              {(!activity?.recentPromotions || activity.recentPromotions.length === 0) && (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">No recent promotions.</div>
              )}
            </motion.div>
          </motion.div>

          <motion.div
            className="glass-card rounded-xl overflow-hidden border border-white/10"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bold text-white text-lg">Announcements</h2>
              <Link href="/announcements" className="text-sm text-primary hover:text-primary/80 transition-colors">View All</Link>
            </div>
            <motion.div className="divide-y divide-white/5" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {announcements?.announcements?.map((ann) => (
                <motion.div key={ann.id} variants={rowVariant}>
                  <Link href={`/announcements/${ann.id}`} className="block px-6 py-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-white text-sm">{ann.title}</span>
                      {ann.isPinned && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex-shrink-0">PINNED</span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{ann.content}</p>
                    <span className="text-muted-foreground text-xs mt-1 block">{formatDate(ann.createdAt)}</span>
                  </Link>
                </motion.div>
              ))}
              {(!announcements?.announcements || announcements.announcements.length === 0) && (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">No announcements yet.</div>
              )}
            </motion.div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
