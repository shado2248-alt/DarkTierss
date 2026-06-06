import { useEffect, useRef, useState } from "react";
import { useGetStats, useGetRecentActivity, useGetLeaderboard, useGetSettings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { TierBadge } from "../components/ui/tier-badge";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronRight, Zap, Shield, Swords, Star, Trophy, Users, MessageCircle, Copy, Check, X, Info, Server } from "lucide-react";

const EASE = [0.25, 0.1, 0.25, 1] as const;

/* ─── Animated counter ───────────────────────────────────── */
function useCountUp(target: number) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !target) return;
    const duration = 1800;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  return { count, ref };
}

function Counter({ value, label }: { value: number; label: string }) {
  const { count, ref } = useCountUp(value);
  return (
    <div className="flex flex-col gap-0.5">
      <span ref={ref} className="text-2xl font-black text-white tabular-nums leading-none">
        {count.toLocaleString()}
      </span>
      <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">{label}</span>
    </div>
  );
}

/* ─── Section label / heading ───────────────────────────── */
function SectionHead({ label, title, sub }: { label: string; title: string; sub?: string }) {
  return (
    <div data-reveal>
      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-primary mb-2">{label}</div>
      <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{title}</h2>
      {sub && <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1 font-semibold">{sub}</p>}
    </div>
  );
}

/* ─── Marquee ────────────────────────────────────────────── */
function Marquee({ matches }: { matches: any[] }) {
  if (!matches.length) return null;
  const items = [...matches, ...matches];
  return (
    <div className="relative overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
      <div className="flex gap-3 w-max" style={{ animation: "marquee-scroll 30s linear infinite" }}>
        {items.map((m, i) => {
          const winner = m.player1Id === m.winnerId ? m.player1Name : m.player2Name;
          const loser  = m.player1Id === m.winnerId ? m.player2Name : m.player1Name;
          return (
            <div key={i} className="flex-shrink-0 flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">{m.gamemodeName}</span>
              <span className="text-xs font-bold text-green-400">{winner}</span>
              <span className="text-[10px] text-muted-foreground/50">def.</span>
              <span className="text-xs text-red-400/70">{loser}</span>
              {m.ratingChange != null && (
                <span className="text-[10px] font-black text-primary font-mono">+{Math.abs(m.ratingChange)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Server IP copy button ──────────────────────────────── */
function ServerIpCopy({ ip }: { ip: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy}
      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-lg px-3 py-2 transition-all group">
      <Server className="w-3.5 h-3.5 text-primary flex-shrink-0" />
      <div className="text-left">
        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">Server IP</div>
        <div className="font-mono font-bold text-white text-sm leading-tight mt-0.5">{ip}</div>
      </div>
      <span className="ml-1 text-muted-foreground/40 group-hover:text-primary transition-colors">
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </span>
    </button>
  );
}

/* ─── Info modal ─────────────────────────────────────────── */
function InfoModal({ onClose, discordUrl }: { onClose: () => void; discordUrl: string }) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.18, ease: EASE }}
          className="glass-card border border-white/15 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_60px_rgba(120,40,200,0.3)]"
          onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
            <h2 className="font-black text-white text-base">Server Information</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/8">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="p-5 flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-primary/70">How Tiers Work</div>
              {[
                { tier: "HT1 / LT1", elo: "2400+ / 2100–2399", color: "#f59e0b" },
                { tier: "HT2 / LT2", elo: "1900–2099 / 1700–1899", color: "#e879f9" },
                { tier: "HT3 / LT3", elo: "1550–1699 / 1400–1549", color: "#818cf8" },
                { tier: "HT4 / LT4", elo: "1250–1399 / 1100–1249", color: "#34d399" },
                { tier: "HT5 / LT5", elo: "1000–1099 / 0–999",    color: "#94a3b8" },
              ].map(t => (
                <div key={t.tier} className="flex items-center justify-between">
                  <span className="font-black text-sm" style={{ color: t.color }}>{t.tier}</span>
                  <span className="text-xs text-muted-foreground font-mono">{t.elo}</span>
                </div>
              ))}
            </div>

            <div className="h-px bg-white/8" />

            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-primary/70">Gamemodes</div>
              <div className="grid grid-cols-2 gap-1.5">
                {["Sword", "Axe", "SMP", "Crystal", "UHC", "DiaPot", "NethPot", "Mace"].map(g => (
                  <div key={g} className="text-xs text-white font-semibold bg-white/5 border border-white/8 rounded-md px-2.5 py-1.5">{g}</div>
                ))}
              </div>
            </div>

            <div className="h-px bg-white/8" />

            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-primary/70">ELO System</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Standard ELO with K=32. Your rating changes based on match outcome vs opponent rating. Win → gain points, lose → lose points. Starting ELO is 1000.
              </p>
            </div>

            <a href={discordUrl || "#"} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl py-3 font-bold text-sm transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.133 18.113a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Join our Discord
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Gamemode descriptions ──────────────────────────────── */
const GM_DESC: Record<string, string> = {
  sword:   "Classic 1v1 blade combat",
  axe:     "Heavy weapon duels",
  smp:     "Survival multiplayer PvP",
  crystal: "PvE-style explosion meta",
  uhc:     "Ultra Hardcore battles",
  diapot:  "Diamond potions brawl",
  nethpot: "Nether potion warfare",
  mace:    "Breeze rod mace duels",
};
const GM_ICON: Record<string, React.ReactNode> = {
  sword:   <Swords className="w-5 h-5" />,
  axe:     <Shield className="w-5 h-5" />,
  smp:     <Star className="w-5 h-5" />,
  crystal: <Zap className="w-5 h-5" />,
  uhc:     <Trophy className="w-5 h-5" />,
  diapot:  <Star className="w-5 h-5" />,
  nethpot: <Zap className="w-5 h-5" />,
  mace:    <Swords className="w-5 h-5" />,
};

/* ─── Reveal wrapper ─────────────────────────────────────── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function Home() {
  const { data: stats }        = useGetStats();
  const { data: activity }     = useGetRecentActivity();
  const { data: leaderboard }  = useGetLeaderboard({ limit: 5 });
  const { data: settingsData } = useGetSettings();

  const settings    = settingsData as any;
  const serverIp    = settings?.serverIp  || "";
  const discordUrl  = settings?.discordUrl || "https://discord.gg/mWHwDR8bg7";
  const recentMatches = activity?.recentMatches ?? [];
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden">

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(ellipse 80% 70% at 50% -5%, rgba(109,40,217,0.28), transparent),
                              radial-gradient(ellipse 40% 40% at 95% 90%, rgba(88,28,220,0.12), transparent)`
          }} />
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(1px 1px at center, rgba(255,255,255,0.032) 0%, transparent 0%)`,
            backgroundSize: "28px 28px"
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 pt-16 pb-14 md:pt-20 md:pb-16">
          <div className="flex flex-col gap-6 max-w-2xl">
            {/* Eyebrow */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-widest">
                <Zap className="w-3 h-3" />Season 1 Active
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-green-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Live
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
              className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95]">
              <span className="text-white">The</span>{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">#1 Elite</span>
              <br />
              <span className="text-white">Minecraft</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-purple-300">PvP Tierlist</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
              className="text-base text-muted-foreground leading-relaxed max-w-md">
              Compete in ranked 1v1s. Get tested by top players.
              <br />Claim your spot on the global leaderboard.
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.28, ease: EASE }}
              className="flex flex-wrap gap-3">
              <Link href="/leaderboard"
                className="group inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-[0_0_24px_rgba(120,40,200,0.4)] hover:shadow-[0_0_36px_rgba(120,40,200,0.6)] hover:-translate-y-0.5">
                <Trophy className="w-4 h-4" />View Tier List
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a href={discordUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#5865F2]/90 hover:bg-[#5865F2] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(88,101,242,0.4)]">
                Apply for Testing
              </a>
              <a href={discordUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 border border-[#5865F2]/50 text-[#7289da] hover:bg-[#5865F2]/10 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5">
                <MessageCircle className="w-4 h-4" />
                Join Discord
              </a>
            </motion.div>

            {/* Stats row */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.38, ease: EASE }}
              className="flex items-center gap-6 pt-1">
              <Counter value={stats?.totalPlayers ?? 0} label="Players Ranked" />
              <div className="w-px h-10 bg-white/10" />
              <Counter value={stats?.totalMatches ?? 0} label="Matches Played" />
              <div className="w-px h-10 bg-white/10" />
              <Counter value={8} label="Game Modes" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ SERVER INFO BAR ═════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}
        className="border-b border-white/8 bg-black/50 backdrop-blur-sm py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          {/* Info button */}
          <button onClick={() => setShowInfo(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 transition-all text-xs font-semibold text-white/70 hover:text-white">
            <Info className="w-3.5 h-3.5 text-primary" />
            Information
          </button>

          <div className="w-px h-5 bg-white/10 hidden sm:block" />

          {/* Server IP */}
          {serverIp && <ServerIpCopy ip={serverIp} />}

          <div className="flex-1" />

          {/* Discord button */}
          <a href={discordUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/30 hover:border-[#5865F2]/50 transition-all text-[#7289da] text-xs font-bold">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.133 18.113a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Discord
          </a>
        </div>
      </motion.div>

      {/* ══ TOP RANKED (mobile only) ════════════════════════════ */}
      <section className="lg:hidden px-4 pb-10 mt-4 relative z-10">
        <div className="max-w-lg mx-auto">
          <div className="glass-card border border-white/12 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(120,40,200,0.15)]">
            <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between bg-black/30">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm font-black text-white">Top Ranked</span>
              </div>
              <Link href="/leaderboard" className="text-[11px] text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5">
                Full Board <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {leaderboard?.entries?.length ? leaderboard.entries.map((entry, i) => (
                <div key={entry.playerId}
                  className={`flex items-center gap-3 px-5 py-3.5 hover:bg-white/4 transition-colors
                    ${i === 0 ? "bg-gradient-to-r from-yellow-500/8 to-transparent" : ""}`}>
                  <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black
                    ${i === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.4)]"
                    : i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-black"
                    : i === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-black"
                    : "bg-white/8 text-white/60"}`}>
                    {i + 1}
                  </span>
                  <img
                    src={`https://mc-heads.net/body/${entry.uuid}/48`}
                    alt={entry.username}
                    className="h-10 w-auto object-contain flex-shrink-0 drop-shadow-md"
                    onError={e => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/${entry.uuid}/32`; }}
                  />
                  <Link href={`/players/${entry.playerId}`} className="flex-1 font-bold text-sm text-white hover:text-primary transition-colors min-w-0 break-words">
                    {entry.username}
                  </Link>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <TierBadge tierName={entry.tierName ?? null} tierColor={entry.tierColor ?? null} />
                    <span className="text-primary font-black text-sm font-mono w-12 text-right">{entry.rating}</span>
                  </div>
                </div>
              )) : (
                <div className="px-5 py-8 text-center text-muted-foreground text-sm">No ranked players yet.</div>
              )}
            </div>
            <div className="px-5 py-3 bg-black/20 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Users className="w-3 h-3" />
                {stats?.totalPlayers ?? 0} total players
              </div>
              <Link href="/players" className="text-[11px] text-primary hover:text-primary/80 transition-colors">
                Browse All
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ MARQUEE ═════════════════════════════════════════════ */}
      <div className="border-y border-white/6 bg-black/40 py-3.5 flex items-center gap-4 overflow-hidden">
        <div className="flex-shrink-0 flex items-center gap-2 pl-4 pr-3 border-r border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-widest text-white/70">Live</span>
        </div>
        <Marquee matches={recentMatches} />
      </div>

      {/* ══ HOW IT WORKS ════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <Reveal>
          <div className="text-center mb-12">
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-primary mb-2">Process</div>
            <h2 className="text-2xl md:text-3xl font-black text-white">How It Works</h2>
            <p className="text-sm text-muted-foreground mt-2">Get your official tier in 4 simple steps</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { num: "01", icon: <Shield className="w-8 h-8" />, title: "Join Discord", desc: "Connect with our community of competitive players and certified testers." },
            { num: "02", icon: <Star className="w-8 h-8" />,   title: "Request a Test", desc: "Submit your application with your username and preferred game modes." },
            { num: "03", icon: <Swords className="w-8 h-8" />, title: "Compete in 1v1s", desc: "Face off against certified testers in your chosen game modes." },
            { num: "04", icon: <Trophy className="w-8 h-8" />, title: "Receive Your Tier", desc: "Your official rank is assigned and published on the global leaderboard." },
          ].map((step, i) => (
            <Reveal key={step.num} delay={i * 0.07}>
              <div className="glass-card border border-white/10 rounded-2xl p-6 h-full hover:border-primary/30 transition-colors">
                <div className="text-4xl font-black text-white/8 mb-4 font-mono">{step.num}</div>
                <div className="w-14 h-14 rounded-2xl bg-primary/12 border border-primary/25 flex items-center justify-center text-primary mb-4">
                  {step.icon}
                </div>
                <h3 className="font-black text-white text-base mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4"><div className="h-px bg-white/6" /></div>

      {/* ══ DISCORD CTA + TOP RANKED ════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

            {/* Discord CTA card */}
            <div className="glass-card border border-[#5865F2]/25 rounded-2xl p-8 flex flex-col gap-6 bg-gradient-to-br from-[#5865F2]/8 to-transparent h-full">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center flex-shrink-0">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#5865F2">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.133 18.113a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Join the Community on Discord</h2>
                  <p className="text-sm text-muted-foreground mt-1">Get notified of tier changes, find matches, and connect with players.</p>
                </div>
              </div>
              <a href={discordUrl} target="_blank" rel="noreferrer"
                className="self-start inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(88,101,242,0.4)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.133 18.113a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
                Join Now
              </a>
            </div>

            {/* Top Ranked card (desktop only — mobile has it below hero) */}
            <div className="glass-card border border-white/12 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(120,40,200,0.18)] hidden lg:block">
              <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between bg-black/30">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-sm font-black text-white">Top Ranked</span>
                </div>
                <Link href="/leaderboard" className="text-[11px] text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5">
                  Full Board <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-white/5">
                {leaderboard?.entries?.length ? leaderboard.entries.map((entry, i) => (
                  <div key={entry.playerId}
                    className={`flex items-center gap-3 px-5 py-3 hover:bg-white/4 transition-colors
                      ${i === 0 ? "bg-gradient-to-r from-yellow-500/8 to-transparent" : ""}`}>
                    <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black
                      ${i === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.4)]"
                      : i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-black"
                      : i === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-black"
                      : "bg-white/8 text-white/60"}`}>
                      {i + 1}
                    </span>
                    <img
                      src={`https://mc-heads.net/body/${entry.uuid}/48`}
                      alt={entry.username}
                      className="h-9 w-auto object-contain flex-shrink-0 drop-shadow-md"
                      onError={e => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/${entry.uuid}/32`; }}
                    />
                    <Link href={`/players/${entry.playerId}`} className="flex-1 font-bold text-sm text-white hover:text-primary transition-colors min-w-0 truncate">
                      {entry.username}
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <TierBadge tierName={entry.tierName ?? null} tierColor={entry.tierColor ?? null} />
                      <span className="text-primary font-black text-sm font-mono w-12 text-right">{entry.rating}</span>
                    </div>
                  </div>
                )) : (
                  <div className="px-5 py-8 text-center text-muted-foreground text-sm">No ranked players yet.</div>
                )}
              </div>
              <div className="px-5 py-3 bg-black/20 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {stats?.totalPlayers ?? 0} total players
                </div>
                <Link href="/players" className="text-[11px] text-primary hover:text-primary/80 transition-colors">
                  Browse All
                </Link>
              </div>
            </div>

          </div>
        </Reveal>
      </section>

      {/* ══ INFO MODAL ══════════════════════════════════════════ */}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} discordUrl={discordUrl} />}

      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
