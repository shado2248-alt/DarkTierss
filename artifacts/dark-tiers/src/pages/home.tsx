import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetStats, useGetRecentActivity, useGetSettings, useGetMe } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronRight, Zap, Shield, Swords, Star, Trophy, Users, MessageCircle, Copy, Check, X, Info, Server } from "lucide-react";
import {
  fetchTierResults, deduplicateByPlayer, abbreviateRank, timeAgo,
  RANK_COLOR, type TierResult,
} from "@/lib/tierlist-api";
const RANK_ROW_COLOR: Record<number, string> = {
  0: "linear-gradient(to bottom, rgba(218,178,0,0.90), rgba(180,142,0,0.84))",
  1: "linear-gradient(to bottom, rgba(130,150,162,0.88), rgba(100,120,135,0.82))",
  2: "linear-gradient(to bottom, rgba(172,98,28,0.88), rgba(140,76,14,0.82))",
};

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

/* ─── Tier result marquee ────────────────────────────────── */
function TierMarquee({ results }: { results: TierResult[] }) {
  if (!results.length) return null;
  const sorted = [...results].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);
  const items = [...sorted, ...sorted];
  return (
    <div className="relative overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
      <div className="flex gap-3 w-max" style={{ animation: "marquee-scroll 30s linear infinite" }}>
        {items.map((r, i) => {
          const color = RANK_COLOR[r.rankEarned] ?? "#94a3b8";
          return (
            <div key={i} className="flex-shrink-0 flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">{r.gamemode}</span>
              <img src={`https://mc-heads.net/avatar/${r.username}/16`} alt="" className="w-4 h-4 rounded flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <span className="text-xs font-bold text-white">{r.username}</span>
              <span className="text-[10px] text-muted-foreground/50">earned</span>
              <span className="text-[10px] font-black" style={{ color }}>{abbreviateRank(r.rankEarned)}</span>
              {r.region && <span className="text-[10px] text-muted-foreground/35">· {r.region}</span>}
              <span className="text-[10px] text-muted-foreground/25">{timeAgo(r.timestamp)}</span>
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

/* ─── Mouse spotlight hook ───────────────────────────────── */
function useMouseSpotlight(ref: React.RefObject<HTMLElement | null>) {
  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  const handleMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [ref]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMove);
    return () => el.removeEventListener("mousemove", handleMove);
  }, [ref, handleMove]);
  return pos;
}

/* ─── Floating orb ───────────────────────────────────────── */
function FloatingOrb({ x, y, size, color, dur, delay }: {
  x: string; y: string; size: number; color: string; dur: number; delay: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none blur-3xl"
      style={{ left: x, top: y, width: size, height: size, background: color }}
      animate={{ y: [0, -30, 0], x: [0, 15, 0], opacity: [0.35, 0.65, 0.35] }}
      transition={{ duration: dur, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

/* ─── Word-stagger title ─────────────────────────────────── */
function AnimatedTitle({ lines }: { lines: { words: { text: string; gradient?: boolean }[] }[] }) {
  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
  };
  const word = {
    hidden: { opacity: 0, y: 28, rotateX: -20 },
    visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as const } },
  };
  return (
    <motion.h1
      variants={container} initial="hidden" animate="visible"
      className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95]"
      style={{ perspective: "600px" }}
    >
      {lines.map((line, li) => (
        <div key={li} className="flex flex-wrap gap-x-4">
          {line.words.map((w, wi) => (
            <motion.span key={wi} variants={word}
              className={w.gradient
                ? "text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-purple-300 inline-block"
                : "text-white inline-block"}>
              {w.text}
            </motion.span>
          ))}
        </div>
      ))}
    </motion.h1>
  );
}

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
  const { data: settingsData } = useGetSettings();
  const { data: me, isLoading: meLoading } = useGetMe();

  const { data: tierResults = [] } = useQuery({
    queryKey: ["tierlist-external"],
    queryFn: fetchTierResults,
    refetchInterval: 10_000,
    staleTime: 9_000,
  });

  const topPlayers = deduplicateByPlayer(tierResults).slice(0, 5);
  const latestResult = [...tierResults].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] ?? null;

  const settings   = settingsData as any;
  const serverIp   = settings?.serverIp  || "";
  const discordUrl = settings?.discordUrl || "https://discord.gg/mWHwDR8bg7";
  const isLoggedIn = !meLoading && !!me;
  const [showInfo, setShowInfo] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);
  const spotlight = useMouseSpotlight(heroRef);

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden">

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Base gradient */}
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(ellipse 80% 70% at 50% -5%, rgba(109,40,217,0.28), transparent),
                              radial-gradient(ellipse 40% 40% at 95% 90%, rgba(88,28,220,0.12), transparent)`
          }} />

          {/* Animated dot grid */}
          <motion.div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(1px 1px at center, rgba(255,255,255,0.045) 0%, transparent 0%)`,
            backgroundSize: "28px 28px"
          }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Floating orbs */}
          <FloatingOrb x="60%" y="10%"  size={320} color="rgba(109,40,217,0.18)"  dur={7}   delay={0} />
          <FloatingOrb x="80%" y="50%"  size={200} color="rgba(139,92,246,0.14)"  dur={5.5} delay={1} />
          <FloatingOrb x="5%"  y="30%"  size={240} color="rgba(88,28,220,0.12)"   dur={8}   delay={0.7} />
          <FloatingOrb x="40%" y="70%"  size={180} color="rgba(167,139,250,0.10)" dur={6}   delay={2} />
          <FloatingOrb x="15%" y="-10%" size={260} color="rgba(109,40,217,0.10)"  dur={9}   delay={1.5} />

          {/* Mouse spotlight */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-100"
            style={{
              background: `radial-gradient(400px circle at ${spotlight.x}px ${spotlight.y}px, rgba(139,92,246,0.07), transparent 70%)`,
            }}
          />

          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 pt-16 pb-14 md:pt-20 md:pb-16">
          <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-16">
          <div className="flex flex-col gap-6 max-w-2xl flex-1">
            {/* Eyebrow */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="flex items-center gap-3">
              <motion.span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-widest"
                animate={{ boxShadow: ["0 0 0px rgba(139,92,246,0)", "0 0 12px rgba(139,92,246,0.4)", "0 0 0px rgba(139,92,246,0)"] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Zap className="w-3 h-3" />Season 1 Active
              </motion.span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-green-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Live
              </span>
            </motion.div>

            {/* Word-stagger animated title */}
            <AnimatedTitle lines={[
              { words: [{ text: "The" }, { text: "#1 Elite", gradient: true }] },
              { words: [{ text: "Minecraft" }] },
              { words: [{ text: "PvP Tierlist", gradient: true }] },
            ]} />

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

          {/* ── Hero right: Top Ranked panel ── */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.45, ease: EASE }}
            className="hidden lg:flex flex-col flex-shrink-0 self-center w-80"
          >
            <div className="glass-card border border-white/12 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(120,40,200,0.22)]">
              <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-black text-white">Top Ranked</span>
                </div>
                <Link href="/leaderboard" className="text-[11px] text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5">
                  Full Board <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="divide-y divide-white/5">
                {topPlayers.length ? topPlayers.map((entry, i) => {
                  const rankColor = RANK_COLOR[entry.rankEarned] ?? "#94a3b8";
                  return (
                    <div
                      key={entry.resultId}
                      className="flex items-center gap-3 px-4 py-3 hover:brightness-105 transition-all relative overflow-hidden"
                    >
                      {RANK_ROW_COLOR[i] && (
                        <div className="pointer-events-none absolute inset-0 z-0" style={{
                          background: RANK_ROW_COLOR[i],
                          clipPath: "polygon(0 0, 220px 0, 185px 100%, 0 100%)",
                        }} />
                      )}
                      <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black z-10
                        ${i === 0 ? "bg-black/20 text-yellow-100 border border-yellow-300/30"
                        : i === 1 ? "bg-black/20 text-slate-100 border border-slate-300/30"
                        : i === 2 ? "bg-black/20 text-orange-100 border border-orange-300/30"
                        : "bg-white/8 text-white/50"}`}>
                        {i + 1}
                      </span>
                      <img
                        src={`https://mc-heads.net/body/${entry.username}/48`}
                        alt={entry.username}
                        className="h-10 w-auto object-contain flex-shrink-0 drop-shadow-lg z-10"
                        onError={e => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/${entry.username}/32`; }}
                      />
                      <span className="flex-1 font-bold text-sm text-white min-w-0 truncate z-10">{entry.username}</span>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 z-10">
                        <span className="text-[11px] font-black" style={{ color: rankColor }}>{abbreviateRank(entry.rankEarned)}</span>
                        <span className="text-[10px] text-white/40">{entry.gamemode}</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="px-4 py-8 text-center text-muted-foreground text-sm">No ranked players yet.</div>
                )}
              </div>

              {serverIp && (
                <div className="px-4 py-2.5 bg-black/50 border-t border-white/8 flex items-center gap-2">
                  <Server className="w-3 h-3 text-primary flex-shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">IP</span>
                  <span className="font-mono font-bold text-white text-xs flex-1">{serverIp}</span>
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-green-400"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              )}
            </div>
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
        </div>
      </motion.div>

      {/* ══ TOP RANKED (mobile only) ════════════════════════════ */}
      <section className="lg:hidden px-4 pb-10 mt-4 relative z-10">
        <div className="max-w-lg mx-auto">
          <div className="glass-card border border-white/12 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(120,40,200,0.15)]">
            <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between bg-black/30">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-black text-white">Top Ranked</span>
              </div>
              <Link href="/leaderboard" className="text-[11px] text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5">
                Full Board <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {topPlayers.length ? topPlayers.map((entry, i) => {
                const rankColor = RANK_COLOR[entry.rankEarned] ?? "#94a3b8";
                return (
                  <div
                    key={entry.resultId}
                    className="flex items-center gap-3 px-5 py-3.5 hover:brightness-105 transition-all relative overflow-hidden"
                  >
                    {RANK_ROW_COLOR[i] && (
                      <div className="pointer-events-none absolute inset-0 z-0" style={{
                        background: RANK_ROW_COLOR[i],
                        clipPath: "polygon(0 0, 230px 0, 195px 100%, 0 100%)",
                      }} />
                    )}
                    <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black z-10
                      ${i === 0 ? "bg-black/20 text-yellow-100 border border-yellow-300/30"
                      : i === 1 ? "bg-black/20 text-slate-100 border border-slate-300/30"
                      : i === 2 ? "bg-black/20 text-orange-100 border border-orange-300/30"
                      : "bg-white/8 text-white/60"}`}>
                      {i + 1}
                    </span>
                    <img
                      src={`https://mc-heads.net/body/${entry.username}/48`}
                      alt={entry.username}
                      className="h-10 w-auto object-contain flex-shrink-0 drop-shadow-lg z-10"
                      onError={e => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/${entry.username}/32`; }}
                    />
                    <span className="flex-1 font-bold text-sm text-white min-w-0 break-words z-10">{entry.username}</span>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0 z-10">
                      <span className="text-[11px] font-black" style={{ color: rankColor }}>{abbreviateRank(entry.rankEarned)}</span>
                      <span className="text-[10px] text-white/40">{entry.gamemode}</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="px-5 py-8 text-center text-muted-foreground text-sm">No ranked players yet.</div>
              )}
            </div>
            <div className="px-5 py-3 bg-black/20 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Users className="w-3 h-3" />
                {tierResults.length} results
              </div>
              <Link href="/leaderboard" className="text-[11px] text-primary hover:text-primary/80 transition-colors">
                Full Board
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ MARQUEE ═════════════════════════════════════════════ */}
      <div className="border-y border-white/6 bg-black/40 py-3.5 flex items-center gap-4 overflow-hidden">
        <div className="flex-shrink-0 flex items-center gap-2 pl-4 pr-3 border-r border-white/10">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-green-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <span className="text-[11px] font-black uppercase tracking-widest text-white/70">Live</span>
        </div>
        <TierMarquee results={tierResults} />
        {tierResults.length === 0 && (
          <span className="text-[11px] text-muted-foreground/30 font-medium">Waiting for results...</span>
        )}
      </div>

      {/* ══ LATEST RESULT BANNER ════════════════════════════════ */}
      <AnimatePresence>
        {latestResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="border-b border-white/5 bg-black/30 px-4 py-2"
          >
            <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Latest Result
              </div>
              <div className="flex items-center gap-2 text-xs">
                <img src={`https://mc-heads.net/avatar/${latestResult.username}/18`} alt="" className="w-4 h-4 rounded" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span className="font-bold text-white">{latestResult.username}</span>
                <span className="text-muted-foreground/50">earned</span>
                <span className="font-black" style={{ color: RANK_COLOR[latestResult.rankEarned] ?? "#94a3b8" }}>
                  {abbreviateRank(latestResult.rankEarned)}
                </span>
                <span className="text-muted-foreground/50">in</span>
                <span className="font-semibold text-white/80">{latestResult.gamemode}</span>
                {latestResult.region && <span className="text-muted-foreground/40">· {latestResult.region}</span>}
                <span className="text-muted-foreground/30">{timeAgo(latestResult.timestamp)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <motion.div
                className="glass-card border border-white/10 rounded-2xl p-6 h-full cursor-default relative overflow-hidden group"
                whileHover={{ y: -4, borderColor: "rgba(139,92,246,0.4)" }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.08), transparent)" }} />
                <motion.div
                  className="text-4xl font-black text-white/8 mb-4 font-mono"
                  whileHover={{ color: "rgba(139,92,246,0.25)" }}
                >{step.num}</motion.div>
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-primary/12 border border-primary/25 flex items-center justify-center text-primary mb-4"
                  whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(139,92,246,0.4)" }}
                  transition={{ duration: 0.2 }}
                >
                  {step.icon}
                </motion.div>
                <h3 className="font-black text-white text-base mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4"><div className="h-px bg-white/6" /></div>

      {/* ══ DISCORD CTA ═════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <Reveal>
          <div className="glass-card border border-[#5865F2]/25 rounded-2xl overflow-hidden bg-gradient-to-br from-[#5865F2]/10 to-transparent">
            <div className="flex flex-col lg:flex-row items-center gap-6 px-8 py-8">
              <div className="flex items-center gap-5 flex-1">
                <div className="w-16 h-16 rounded-2xl bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center flex-shrink-0">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="#5865F2">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.133 18.113a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Join the Community on Discord</h2>
                  <p className="text-sm text-muted-foreground mt-1">Get notified of tier changes, find matches, and connect with competitive players.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 flex-shrink-0">
                <a href={discordUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(88,101,242,0.45)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.133 18.113a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                  Join Now
                </a>
                <Link href="/leaderboard"
                  className="inline-flex items-center gap-2 border border-white/15 text-white/70 hover:text-white hover:border-white/30 px-7 py-3.5 rounded-xl font-bold text-sm transition-all hover:bg-white/5">
                  View Leaderboard <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ REGISTER CTA (only for visitors) ═══════════════════ */}
      {!isLoggedIn && <section className="relative overflow-hidden py-20 px-4">
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(ellipse 60% 80% at 50% 50%, rgba(109,40,217,0.15), transparent)`
          }} />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: "rgba(109,40,217,0.06)" }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <Reveal>
          <div className="relative max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
            {/* Animated icon */}
            <motion.div
              className="w-20 h-20 rounded-3xl bg-primary/15 border border-primary/30 flex items-center justify-center"
              animate={{
                boxShadow: ["0 0 0px rgba(139,92,246,0.2)", "0 0 40px rgba(139,92,246,0.5)", "0 0 0px rgba(139,92,246,0.2)"]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Trophy className="w-10 h-10 text-primary" />
            </motion.div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">Get Ranked Today</div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
                Ready to prove your skill?
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
                Create your free account with Discord, get tested by certified players, and claim your official tier on the global leaderboard.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 justify-center">
              {["Free to join", "8 Gamemodes", "Official ELO ranking", "Minecraft avatars"].map((f, i) => (
                <motion.span key={f}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.3, ease: EASE }}
                  className="text-xs font-semibold text-primary/80 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full"
                >
                  {f}
                </motion.span>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }}>
                <Link href="/login"
                  className="inline-flex items-center gap-2.5 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-black text-base transition-all shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:shadow-[0_0_50px_rgba(139,92,246,0.7)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.133 18.113a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                  Register with Discord
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }}>
                <Link href="/leaderboard"
                  className="inline-flex items-center gap-2 border border-white/15 text-white/70 hover:text-white hover:border-white/30 px-8 py-4 rounded-xl font-bold text-base transition-all hover:bg-white/5">
                  Browse Rankings <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </div>
        </Reveal>
      </section>}

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
