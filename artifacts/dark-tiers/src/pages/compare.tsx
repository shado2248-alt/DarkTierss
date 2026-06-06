import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  useListPlayers,
  useGetPlayer,
  useListPlayerMatches,
  useListGamemodes,
} from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { TierBadge } from "@/components/ui/tier-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy, Swords, TrendingUp, Search, X, ArrowLeftRight,
  Shield, Star, ChevronRight, Users,
} from "lucide-react";
import { Link } from "wouter";

const EASE = [0.25, 0.1, 0.25, 1] as const;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (n: number) => n.toLocaleString();
const pct = (w: number, t: number) => (t > 0 ? Math.round((w / t) * 100) : 0);

function mcHead(uuid: string, size = 36) {
  return `https://mc-heads.net/avatar/${uuid}/${size}`;
}
function mcBody(uuid: string) {
  return `https://mc-heads.net/body/${uuid}/80`;
}

const REGION_CLS: Record<string, string> = {
  NA: "text-red-400 border-red-500/40 bg-red-500/10",
  EU: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  AS: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
  OC: "text-green-400 border-green-500/40 bg-green-500/10",
  SA: "text-orange-400 border-orange-500/40 bg-orange-500/10",
};

/* ─── Player search combobox ─────────────────────────────────────────────── */
function PlayerPicker({
  label,
  selectedId,
  onSelect,
  excludeId,
  side,
}: {
  label: string;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  excludeId: number | null;
  side: "left" | "right";
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useListPlayers({ search: query || undefined, limit: 20 });
  const { data: selected } = useGetPlayer(selectedId!, {
    query: { enabled: !!selectedId } as any,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const accentCls =
    side === "left"
      ? "border-primary/40 bg-primary/5 focus-within:border-primary/70"
      : "border-violet-400/40 bg-violet-500/5 focus-within:border-violet-400/70";
  const pillCls =
    side === "left"
      ? "bg-primary/20 border-primary/40 text-primary"
      : "bg-violet-500/20 border-violet-400/40 text-violet-300";

  if (selected && selectedId) {
    const p = selected as any;
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${accentCls} transition-colors`}
      >
        <img
          src={mcHead(p.uuid, 36)}
          alt={p.username}
          className="w-9 h-9 rounded-lg bg-black"
          onError={e => { (e.target as HTMLImageElement).src = mcHead("steve", 36); }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-black text-white text-sm truncate">{p.username}</div>
          <div className={`text-[10px] font-bold uppercase tracking-widest ${pillCls.split(" ").slice(-1)[0]}`}>
            {p.region ?? "—"}
          </div>
        </div>
        <button
          onClick={() => onSelect(null)}
          className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${accentCls} transition-colors`}>
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          className="flex-1 bg-transparent text-sm text-white placeholder:text-muted-foreground/60 outline-none"
          placeholder={label}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full mt-1.5 left-0 right-0 rounded-xl border border-white/10 bg-[#0e0e14] shadow-2xl overflow-hidden"
          >
            {(data?.players ?? []).length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">No players found</div>
            ) : (
              <div className="max-h-56 overflow-y-auto divide-y divide-white/5">
                {(data?.players ?? [])
                  .filter(p => p.id !== excludeId)
                  .map(p => (
                    <button
                      key={p.id}
                      onClick={() => { onSelect(p.id); setOpen(false); setQuery(""); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <img
                        src={mcHead(p.uuid, 28)}
                        alt={p.username}
                        className="w-7 h-7 rounded bg-black flex-shrink-0"
                        onError={e => { (e.target as HTMLImageElement).src = mcHead("steve", 28); }}
                      />
                      <span className="font-semibold text-sm text-white truncate">{p.username}</span>
                      {p.region && (
                        <span className={`ml-auto text-[10px] font-black px-1.5 py-0.5 rounded border ${REGION_CLS[p.region] ?? "text-white/40 border-white/10"}`}>
                          {p.region}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Stat block ─────────────────────────────────────────────────────────── */
function StatBlock({
  label,
  left,
  right,
  highlight,
}: {
  label: string;
  left: number | string;
  right: number | string;
  highlight?: "left" | "right" | "tie";
}) {
  const lv = typeof left === "number" ? left : parseFloat(String(left));
  const rv = typeof right === "number" ? right : parseFloat(String(right));
  const winner = highlight ?? (isNaN(lv) || isNaN(rv) ? "tie" : lv > rv ? "left" : rv > lv ? "right" : "tie");

  return (
    <div className="grid grid-cols-3 items-center gap-2 py-2.5 border-b border-white/5 last:border-0">
      <div className={`text-right font-black text-base ${winner === "left" ? "text-primary" : "text-white/70"}`}>
        {left}
        {winner === "left" && <span className="ml-1 text-[10px] text-primary">▲</span>}
      </div>
      <div className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</div>
      <div className={`text-left font-black text-base ${winner === "right" ? "text-violet-300" : "text-white/70"}`}>
        {winner === "right" && <span className="mr-1 text-[10px] text-violet-300">▲</span>}
        {right}
      </div>
    </div>
  );
}

/* ─── ELO bar row ────────────────────────────────────────────────────────── */
function EloBarRow({
  gamemodeName,
  leftRating,
  rightRating,
  leftTierName,
  leftTierColor,
  rightTierName,
  rightTierColor,
}: {
  gamemodeName: string;
  leftRating: number | null;
  rightRating: number | null;
  leftTierName: string | null;
  leftTierColor: string | null;
  rightTierName: string | null;
  rightTierColor: string | null;
}) {
  const lv = leftRating ?? 0;
  const rv = rightRating ?? 0;
  const total = lv + rv;
  const leftPct = total === 0 ? 50 : Math.round((lv / total) * 100);
  const rightPct = 100 - leftPct;

  const diff = lv - rv;
  const diffLabel = diff === 0 ? "TIE" : `${diff > 0 ? "+" : ""}${diff}`;
  const diffColor = diff > 0 ? "text-primary" : diff < 0 ? "text-violet-300" : "text-muted-foreground";

  return (
    <div className="py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {leftRating !== null ? (
            <>
              <span className="font-mono font-black text-white text-sm">{lv}</span>
              <TierBadge tierName={leftTierName} tierColor={leftTierColor} />
            </>
          ) : <span className="text-muted-foreground/40 text-xs">Unranked</span>}
        </div>
        <div className="flex flex-col items-center flex-shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{gamemodeName}</span>
          <span className={`text-[11px] font-black ${diffColor}`}>{diffLabel}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0 justify-end">
          {rightRating !== null ? (
            <>
              <TierBadge tierName={rightTierName} tierColor={rightTierColor} />
              <span className="font-mono font-black text-white text-sm">{rv}</span>
            </>
          ) : <span className="text-muted-foreground/40 text-xs">Unranked</span>}
        </div>
      </div>
      {/* Bar */}
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden flex">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${leftPct}%` }}
          transition={{ duration: 0.6, ease: EASE }}
          className="h-full rounded-l-full bg-gradient-to-r from-primary/80 to-primary"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${rightPct}%` }}
          transition={{ duration: 0.6, ease: EASE }}
          className="h-full rounded-r-full bg-gradient-to-r from-violet-500 to-violet-400"
        />
      </div>
    </div>
  );
}

/* ─── Head-to-head section ───────────────────────────────────────────────── */
function HeadToHead({
  p1Id,
  p1Name,
  p1Uuid,
  p2Id,
  p2Name,
  p2Uuid,
}: {
  p1Id: number;
  p1Name: string;
  p1Uuid: string;
  p2Id: number;
  p2Name: string;
  p2Uuid: string;
}) {
  const { data: p1Matches } = useListPlayerMatches({ playerId: p1Id, limit: 200 });
  const matches = (p1Matches as any)?.matches ?? [];

  const h2h = (matches as any[]).filter(
    (m: any) => (m.winnerId === p1Id || m.loserId === p1Id) &&
                (m.winnerId === p2Id || m.loserId === p2Id)
  );

  const p1Wins = h2h.filter((m: any) => m.winnerId === p1Id).length;
  const p2Wins = h2h.filter((m: any) => m.winnerId === p2Id).length;
  const total = h2h.length;

  if (total === 0) {
    return (
      <div className="glass-card border border-white/8 rounded-2xl p-8 text-center">
        <Swords className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">These players have not faced each other yet.</p>
      </div>
    );
  }

  const p1Pct = Math.round((p1Wins / total) * 100);

  return (
    <div className="glass-card border border-white/8 rounded-2xl overflow-hidden">
      {/* Score */}
      <div className="grid grid-cols-3 items-center gap-4 p-6 bg-black/20">
        <div className="text-center">
          <img src={mcHead(p1Uuid, 40)} alt={p1Name} className="w-10 h-10 rounded-lg bg-black mx-auto mb-1.5"
            onError={e => { (e.target as HTMLImageElement).src = mcHead("steve", 40); }} />
          <div className="font-black text-white text-sm truncate">{p1Name}</div>
          <div className={`text-3xl font-black mt-1 ${p1Wins > p2Wins ? "text-primary" : "text-white/40"}`}>{p1Wins}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Head-to-Head</div>
          <div className="text-xs text-muted-foreground">{total} match{total !== 1 ? "es" : ""}</div>
          <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden flex">
            <div className="h-full bg-primary rounded-l-full" style={{ width: `${p1Pct}%` }} />
            <div className="h-full bg-violet-500 rounded-r-full" style={{ width: `${100 - p1Pct}%` }} />
          </div>
        </div>
        <div className="text-center">
          <img src={mcHead(p2Uuid, 40)} alt={p2Name} className="w-10 h-10 rounded-lg bg-black mx-auto mb-1.5"
            onError={e => { (e.target as HTMLImageElement).src = mcHead("steve", 40); }} />
          <div className="font-black text-white text-sm truncate">{p2Name}</div>
          <div className={`text-3xl font-black mt-1 ${p2Wins > p1Wins ? "text-violet-300" : "text-white/40"}`}>{p2Wins}</div>
        </div>
      </div>

      {/* Match list */}
      <div className="divide-y divide-white/5">
        {h2h.slice(0, 10).map((m: any) => {
          const p1Won = m.winnerId === p1Id;
          return (
            <div key={m.id} className="flex items-center gap-3 px-5 py-2.5 text-sm hover:bg-white/3 transition-colors">
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${p1Won ? "text-primary border-primary/40 bg-primary/10" : "text-violet-300 border-violet-400/40 bg-violet-500/10"}`}>
                {p1Won ? p1Name : p2Name} won
              </span>
              <span className="text-muted-foreground/50 text-xs">{m.gamemodeName ?? "—"}</span>
              <span className="ml-auto text-xs text-muted-foreground/40">
                {new Date(m.playedAt).toLocaleDateString()}
              </span>
              {m.ratingChange != null && (
                <span className="text-[10px] text-muted-foreground/40">±{m.ratingChange}</span>
              )}
            </div>
          );
        })}
        {h2h.length > 10 && (
          <div className="px-5 py-2.5 text-xs text-muted-foreground/50 text-center">
            +{h2h.length - 10} more matches
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function Compare() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );

  const [p1Id, setP1Id] = useState<number | null>(
    params.get("p1") ? Number(params.get("p1")) : null
  );
  const [p2Id, setP2Id] = useState<number | null>(
    params.get("p2") ? Number(params.get("p2")) : null
  );

  // Sync selections → URL params
  useEffect(() => {
    const sp = new URLSearchParams();
    if (p1Id) sp.set("p1", String(p1Id));
    if (p2Id) sp.set("p2", String(p2Id));
    const qs = sp.toString();
    const newPath = qs ? `/compare?${qs}` : "/compare";
    if (window.location.pathname + window.location.search !== newPath) {
      window.history.replaceState({}, "", newPath);
    }
  }, [p1Id, p2Id]);

  const { data: p1Data } = useGetPlayer(p1Id!, {
    query: { enabled: !!p1Id } as any,
  });
  const { data: p2Data } = useGetPlayer(p2Id!, {
    query: { enabled: !!p2Id } as any,
  });
  const { data: gamemodes } = useListGamemodes();

  const p1 = p1Data as any;
  const p2 = p2Data as any;
  const gms = (gamemodes ?? []) as any[];

  const canCompare = !!p1 && !!p2;

  // Build per-gamemode rating maps
  const p1Ratings: Record<number, any> = {};
  const p2Ratings: Record<number, any> = {};
  (p1?.ratings ?? []).forEach((r: any) => { p1Ratings[r.gamemodeId] = r; });
  (p2?.ratings ?? []).forEach((r: any) => { p2Ratings[r.gamemodeId] = r; });

  // Overall computed stats
  const p1Total = (p1?.ratings ?? []).reduce((a: number, r: any) => a + (r.totalMatches ?? 0), 0);
  const p2Total = (p2?.ratings ?? []).reduce((a: number, r: any) => a + (r.totalMatches ?? 0), 0);
  const p1Wins  = (p1?.ratings ?? []).reduce((a: number, r: any) => a + (r.wins ?? 0), 0);
  const p2Wins  = (p2?.ratings ?? []).reduce((a: number, r: any) => a + (r.wins ?? 0), 0);
  const p1Peak  = (p1?.ratings ?? []).reduce((a: number, r: any) => Math.max(a, r.peakRating ?? r.rating ?? 0), 0);
  const p2Peak  = (p2?.ratings ?? []).reduce((a: number, r: any) => Math.max(a, r.peakRating ?? r.rating ?? 0), 0);
  const p1Best  = (p1?.ratings ?? []).reduce((a: number, r: any) => Math.max(a, r.rating ?? 0), 0);
  const p2Best  = (p2?.ratings ?? []).reduce((a: number, r: any) => Math.max(a, r.rating ?? 0), 0);
  const p1WR    = pct(p1Wins, p1Total);
  const p2WR    = pct(p2Wins, p2Total);
  const p1Ranked = (p1?.ratings ?? []).filter((r: any) => r.rating != null).length;
  const p2Ranked = (p2?.ratings ?? []).filter((r: any) => r.rating != null).length;

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-primary mb-1">Matchup</div>
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
              <ArrowLeftRight className="w-7 h-7 text-primary" />
              Compare Players
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Select two players to compare their stats, ELO, and head-to-head record.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Picker row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: EASE }}
          className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center"
        >
          <PlayerPicker
            label="Search player 1..."
            selectedId={p1Id}
            onSelect={setP1Id}
            excludeId={p2Id}
            side="left"
          />
          <div className="flex items-center justify-center">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-muted-foreground">
              <Swords className="w-4 h-4" />
            </div>
          </div>
          <PlayerPicker
            label="Search player 2..."
            selectedId={p2Id}
            onSelect={setP2Id}
            excludeId={p1Id}
            side="right"
          />
        </motion.div>

        {/* Empty state */}
        {!canCompare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-primary/60" />
            </div>
            <p className="text-muted-foreground text-sm">
              {!p1Id && !p2Id
                ? "Select two players to start the comparison"
                : "Select a second player to compare"}
            </p>
          </motion.div>
        )}

        {/* Comparison content */}
        <AnimatePresence mode="wait">
          {canCompare && (
            <motion.div
              key={`${p1Id}-${p2Id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="flex flex-col gap-6"
            >
              {/* ── Player banners ── */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { p: p1, side: "left" as const },
                  { p: p2, side: "right" as const },
                ].map(({ p, side }) => {
                  const isLeft = side === "left";
                  const accent = isLeft ? "from-primary/15 to-transparent border-primary/20" : "from-violet-500/15 to-transparent border-violet-400/20";
                  const textAccent = isLeft ? "text-primary" : "text-violet-300";
                  const totalMatches = (p.ratings ?? []).reduce((a: number, r: any) => a + (r.totalMatches ?? 0), 0);
                  const wins = (p.ratings ?? []).reduce((a: number, r: any) => a + (r.wins ?? 0), 0);
                  const bestRating = (p.ratings ?? []).reduce((a: number, r: any) => Math.max(a, r.rating ?? 0), 0);

                  return (
                    <div key={p.id} className={`glass-card border bg-gradient-to-br ${accent} rounded-2xl p-5 flex flex-col items-center text-center gap-3`}>
                      <img
                        src={mcBody(p.uuid)}
                        alt={p.username}
                        className="h-20 w-auto object-contain drop-shadow-lg"
                        onError={e => { (e.target as HTMLImageElement).src = mcHead(p.uuid, 64); }}
                      />
                      <div>
                        <Link href={`/players/${p.id}`} className={`font-black text-lg text-white hover:${textAccent} transition-colors`}>
                          {p.username}
                        </Link>
                        {p.region && (
                          <div className={`inline-flex mt-1 text-[10px] font-black px-1.5 py-0.5 rounded border ${REGION_CLS[p.region] ?? "text-white/40 border-white/10"}`}>
                            {p.region}
                          </div>
                        )}
                      </div>
                      <div className="w-full grid grid-cols-3 gap-2 pt-1">
                        {[
                          { label: "Best ELO", value: bestRating || "—" },
                          { label: "Matches", value: totalMatches },
                          { label: "Win Rate", value: totalMatches > 0 ? `${pct(wins, totalMatches)}%` : "—" },
                        ].map(s => (
                          <div key={s.label} className="flex flex-col items-center gap-0.5">
                            <span className={`font-black text-sm ${textAccent}`}>{s.value}</span>
                            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">{s.label}</span>
                          </div>
                        ))}
                      </div>
                      <Link
                        href={`/players/${p.id}`}
                        className={`text-[11px] ${textAccent} hover:opacity-70 transition-opacity flex items-center gap-0.5`}
                      >
                        View Profile <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* ── Overall stats comparison ── */}
              <div className="glass-card border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/8 bg-black/30 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-sm font-black text-white">Overall Stats</span>
                </div>
                <div className="px-5 py-2">
                  {/* Column labels */}
                  <div className="grid grid-cols-3 items-center gap-2 py-2 mb-1">
                    <div className="text-right">
                      <span className="text-[11px] font-black text-primary truncate max-w-[100px] inline-block">{p1.username}</span>
                    </div>
                    <div />
                    <div className="text-left">
                      <span className="text-[11px] font-black text-violet-300 truncate max-w-[100px] inline-block">{p2.username}</span>
                    </div>
                  </div>
                  <StatBlock label="Best Rating" left={p1Best || "—"} right={p2Best || "—"} />
                  <StatBlock label="Peak Rating" left={p1Peak || "—"} right={p2Peak || "—"} />
                  <StatBlock label="Total Matches" left={p1Total} right={p2Total} />
                  <StatBlock label="Wins" left={p1Wins} right={p2Wins} />
                  <StatBlock label="Win Rate" left={`${p1WR}%`} right={`${p2WR}%`} />
                  <StatBlock label="Gamemodes" left={p1Ranked} right={p2Ranked} />
                </div>
              </div>

              {/* ── Per-gamemode ELO ── */}
              <div className="glass-card border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/8 bg-black/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-black text-white">ELO by Gamemode</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-primary flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />{p1.username}</span>
                    <span className="text-violet-300 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />{p2.username}</span>
                  </div>
                </div>
                <div className="px-5 py-2">
                  {gms.map(gm => (
                    <EloBarRow
                      key={gm.id}
                      gamemodeName={gm.name}
                      leftRating={p1Ratings[gm.id]?.rating ?? null}
                      rightRating={p2Ratings[gm.id]?.rating ?? null}
                      leftTierName={p1Ratings[gm.id]?.tierName ?? null}
                      leftTierColor={p1Ratings[gm.id]?.tierColor ?? null}
                      rightTierName={p2Ratings[gm.id]?.tierName ?? null}
                      rightTierColor={p2Ratings[gm.id]?.tierColor ?? null}
                    />
                  ))}
                </div>
              </div>

              {/* ── Head to head ── */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-black text-white uppercase tracking-widest">Head to Head</h2>
                </div>
                <HeadToHead
                  p1Id={p1.id}
                  p1Name={p1.username}
                  p1Uuid={p1.uuid}
                  p2Id={p2.id}
                  p2Name={p2.username}
                  p2Uuid={p2.uuid}
                />
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
