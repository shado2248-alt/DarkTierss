import { useRef } from "react";
import { useGetStats, useGetRecentActivity, useListAnnouncements, useGetLeaderboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { TierBadge } from "../components/ui/tier-badge";
import { motion, useInView } from "framer-motion";
import { ChevronRight, Swords, Trophy, Shield, Zap, Star } from "lucide-react";

const EASE = [0.25, 0.1, 0.25, 1] as const;

const TIERS = [
  { name: "HT1", color: "#FFD700" }, { name: "LT1", color: "#DAA520" },
  { name: "HT2", color: "#FF6347" }, { name: "LT2", color: "#CC3333" },
  { name: "HT3", color: "#4488FF" }, { name: "LT3", color: "#3366CC" },
  { name: "HT4", color: "#44CC88" }, { name: "LT4", color: "#339966" },
  { name: "HT5", color: "#AA88FF" }, { name: "LT5", color: "#886699" },
];

const GAMEMODES = ["Sword", "Axe", "SMP", "Crystal", "UHC", "DiaPot", "NethPot", "Mace"];

const MARQUEE_ITEMS = [...TIERS.map(t => ({ type: "tier" as const, ...t })), ...GAMEMODES.map(g => ({ type: "mode" as const, name: g, color: "#7c3aed" }))];

function MarqueeTrack() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="relative w-full overflow-hidden py-3 select-none" style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
      <div
        className="flex gap-3 w-max"
        style={{ animation: "marquee-scroll 28s linear infinite" }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="flex-shrink-0 text-[11px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border"
            style={{
              background: `${item.color}18`,
              color: item.color,
              borderColor: `${item.color}35`,
              textShadow: `0 0 12px ${item.color}60`,
            }}
          >
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatCard({ value, label, icon, delay }: { value: number | string; label: string; icon: React.ReactNode; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay, ease: EASE }}
      className="glass-card border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors text-center group"
    >
      <div className="text-primary/70 group-hover:text-primary transition-colors mb-1">{icon}</div>
      <div className="text-4xl font-black text-white tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{label}</div>
    </motion.div>
  );
}

function SectionCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay, ease: EASE }}
      className="glass-card border border-white/10 rounded-2xl overflow-hidden"
    >
      {children}
    </motion.div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Home() {
  const { data: stats } = useGetStats();
  const { data: activity } = useGetRecentActivity();
  const { data: announcements } = useListAnnouncements({ limit: 4 });
  const { data: leaderboard } = useGetLeaderboard({ limit: 5 });

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(ellipse 90% 60% at 50% -10%, rgba(120,40,200,0.22), transparent),
                              radial-gradient(ellipse 50% 50% at 100% 80%, rgba(88,28,220,0.1), transparent),
                              radial-gradient(ellipse 40% 30% at 0% 60%, rgba(60,0,160,0.12), transparent)`
          }} />
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(1px 1px at center, rgba(255,255,255,0.035) 0%, transparent 0%)`,
            backgroundSize: "26px 26px"
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest"
          >
            <Zap className="w-3 h-3" />
            Elite Minecraft PvP Rankings
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="text-7xl md:text-9xl font-black tracking-tight leading-none"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50">DARK</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-primary"
              style={{ textShadow: "0 0 80px rgba(120,40,200,0.4)" }}>
              TIERS
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
          >
            Track your ELO, earn your tier, and prove your dominance across 8 competitive gamemodes.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
            className="flex flex-wrap gap-3 justify-center"
          >
            <Link
              href="/leaderboard"
              className="group inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-[0_0_28px_rgba(120,40,200,0.45)] hover:shadow-[0_0_40px_rgba(120,40,200,0.65)] hover:-translate-y-0.5"
            >
              <Trophy className="w-4 h-4" />
              View Leaderboard
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/players"
              className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/15 text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5"
            >
              <Shield className="w-4 h-4" />
              Browse Players
            </Link>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-2 rounded-full bg-primary/60"
            />
          </div>
        </motion.div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────────────── */}
      <div className="border-y border-white/5 bg-black/30 py-1">
        <MarqueeTrack />
      </div>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value={stats?.totalPlayers ?? 0} label="Players" icon={<Shield className="w-5 h-5" />} delay={0} />
          <StatCard value={stats?.totalMatches ?? 0} label="Matches" icon={<Swords className="w-5 h-5" />} delay={0.08} />
          <StatCard value={stats?.totalTests ?? 0} label="Tier Tests" icon={<Star className="w-5 h-5" />} delay={0.16} />
          <StatCard value={8} label="Gamemodes" icon={<Trophy className="w-5 h-5" />} delay={0.24} />
        </div>
      </section>

      {/* ── TIER LADDER ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <SectionCard>
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-black text-white tracking-tight">Tier Ladder</h2>
            <p className="text-xs text-muted-foreground mt-0.5">From unranked to elite — every tier has a path.</p>
          </div>
          <div className="px-6 py-5 flex flex-wrap gap-3">
            {TIERS.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className="text-sm font-black px-4 py-2 rounded-xl border font-mono tracking-wider"
                  style={{ background: `${tier.color}18`, color: tier.color, borderColor: `${tier.color}35`, boxShadow: `0 0 16px ${tier.color}20` }}
                >
                  {tier.name}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {i === 0 ? "2400+" : i === 1 ? "2100+" : i === 2 ? "1900+" : i === 3 ? "1700+" : i === 4 ? "1550+" : i === 5 ? "1400+" : i === 6 ? "1250+" : i === 7 ? "1100+" : i === 8 ? "1000+" : "0+"}
                </span>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </section>

      {/* ── TOP PLAYERS + RECENT MATCHES ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard>
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-black text-white tracking-tight">Top Players</h2>
            <Link href="/leaderboard" className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              Full Board <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {leaderboard?.entries?.length ? leaderboard.entries.map((entry, i) => (
              <motion.div
                key={entry.playerId}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.06, ease: EASE }}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/4 transition-colors"
              >
                <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black
                  ${i === 0 ? "bg-gradient-to-br from-yellow-500 to-amber-400 text-black" :
                    i === 1 ? "bg-gradient-to-br from-slate-400 to-slate-300 text-black" :
                    i === 2 ? "bg-gradient-to-br from-orange-600 to-orange-400 text-black" :
                    "bg-white/8 text-white/60"}`}>
                  {i + 1}
                </span>
                <img
                  src={`https://mc-heads.net/avatar/${entry.uuid}/32`}
                  alt={entry.username}
                  className="w-8 h-8 rounded-lg flex-shrink-0 bg-black"
                  onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/32"; }}
                />
                <Link href={`/players/${entry.playerId}`} className="flex-1 font-bold text-sm text-white hover:text-primary transition-colors truncate">
                  {entry.username}
                </Link>
                <TierBadge tierName={entry.tierName ?? null} tierColor={entry.tierColor ?? null} />
                <span className="font-black text-sm text-primary font-mono flex-shrink-0">{entry.rating}</span>
              </motion.div>
            )) : (
              <div className="px-6 py-10 text-center text-muted-foreground text-sm">No ranked players yet.</div>
            )}
          </div>
        </SectionCard>

        <SectionCard delay={0.08}>
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-black text-white tracking-tight">Recent Matches</h2>
            <Link href="/matches" className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              All Matches <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {activity?.recentMatches?.length ? activity.recentMatches.map((match, i) => {
              const winnerName = match.player1Id === match.winnerId ? match.player1Name : match.player2Name;
              const loserName  = match.player1Id === match.winnerId ? match.player2Name : match.player1Name;
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.06, ease: EASE }}
                  className="flex items-center gap-3 px-6 py-3.5 hover:bg-white/4 transition-colors"
                >
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-2 py-0.5 rounded flex-shrink-0 w-14 text-center">
                    {match.gamemodeName}
                  </span>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-sm font-bold text-green-400 truncate">{winnerName}</span>
                    <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">vs</span>
                    <span className="text-sm text-red-400/70 truncate">{loserName}</span>
                  </div>
                  {match.ratingChange != null && (
                    <span className="text-xs font-black text-primary font-mono flex-shrink-0">+{match.ratingChange}</span>
                  )}
                </motion.div>
              );
            }) : (
              <div className="px-6 py-10 text-center text-muted-foreground text-sm">No recent matches.</div>
            )}
          </div>
        </SectionCard>
      </section>

      {/* ── PROMOTIONS + ANNOUNCEMENTS ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard>
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-black text-white tracking-tight">Recent Promotions</h2>
          </div>
          <div className="divide-y divide-white/5">
            {activity?.recentPromotions?.length ? activity.recentPromotions.map((promo, i) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.06, ease: EASE }}
                className="flex items-center gap-3 px-6 py-3.5 hover:bg-white/4 transition-colors"
              >
                <Link href={`/players/${promo.playerId}`} className="flex-1 font-bold text-sm text-white hover:text-primary transition-colors truncate">
                  {promo.playerName}
                </Link>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{promo.gamemodeName}</span>
                <TierBadge tierName={promo.toTier} tierColor="#9333ea" />
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatDate(promo.promotedAt)}</span>
              </motion.div>
            )) : (
              <div className="px-6 py-10 text-center text-muted-foreground text-sm">No recent promotions.</div>
            )}
          </div>
        </SectionCard>

        <SectionCard delay={0.08}>
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-black text-white tracking-tight">Announcements</h2>
            <Link href="/announcements" className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {announcements?.announcements?.length ? announcements.announcements.map((ann, i) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.06, ease: EASE }}
              >
                <Link href={`/announcements/${ann.id}`} className="block px-6 py-4 hover:bg-white/4 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white text-sm">{ann.title}</span>
                    {ann.isPinned && (
                      <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full flex-shrink-0 font-bold">PINNED</span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs mt-1 line-clamp-2 leading-relaxed">{ann.content}</p>
                  <span className="text-muted-foreground/50 text-[10px] mt-1.5 block">{formatDate(ann.createdAt)}</span>
                </Link>
              </motion.div>
            )) : (
              <div className="px-6 py-10 text-center text-muted-foreground text-sm">No announcements yet.</div>
            )}
          </div>
        </SectionCard>
      </section>

      {/* CSS for marquee */}
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
