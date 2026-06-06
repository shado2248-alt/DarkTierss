import { useState } from "react";
import { useListMatches, useListGamemodes } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { GamemodeIcon } from "@/lib/gamemode-icons";

function Th({ children, right, center }: { children: React.ReactNode; right?: boolean; center?: boolean }) {
  return (
    <th className={`px-3 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap select-none
      ${right ? "text-right" : center ? "text-center" : "text-left"}`}>
      {children}
    </th>
  );
}

export default function Matches() {
  const [search, setSearch] = useState("");
  const [gamemodeId, setGamemodeId] = useState<number | null>(null);

  const { data: gamemodes } = useListGamemodes();
  const { data, isLoading } = useListMatches({ gamemodeId: gamemodeId ?? undefined, limit: 100 });

  const tabs = [
    { id: null as number | null, label: "All Modes", iconName: "all" },
    ...(gamemodes?.map(g => ({ id: g.id, label: g.name, iconName: g.name })) ?? []),
  ];

  const filtered = (data?.matches ?? []).filter(m =>
    !search || [m.player1Name, m.player2Name].some(n => n.toLowerCase().includes(search.toLowerCase()))
  );

  const activeIdx = tabs.findIndex(t => t.id === gamemodeId);

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-screen-xl px-4 flex flex-col gap-0">

        {/* Header */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Match History</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {data
                ? `${data.total} total matches${gamemodeId ? ` · ${tabs.find(t => t.id === gamemodeId)?.label}` : ""}`
                : "Recent battles across the platform."}
            </p>
          </div>
          <div className="relative w-52 flex-shrink-0">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search player..."
              className="pl-8 h-8 text-xs bg-card border-border/50 text-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Icon tabs */}
        <div className="flex items-end gap-0 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const active = gamemodeId === tab.id;
            return (
              <button
                key={tab.id ?? "all"}
                onClick={() => { setGamemodeId(tab.id); setSearch(""); }}
                className={`relative flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all
                  ${active
                    ? "text-white bg-card border border-border/60 border-b-0 rounded-t-xl -mb-px z-10"
                    : "text-muted-foreground hover:text-white/80 hover:bg-white/5 rounded-t-xl"
                  }`}
              >
                {tab.id === null
                  ? <span className="text-base leading-none">⚔️</span>
                  : <GamemodeIcon name={tab.label} size={20} />
                }
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={gamemodeId ?? "all"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className={`border border-border/60 bg-card overflow-hidden
              ${activeIdx === 0 ? "rounded-b-xl rounded-tr-xl" : "rounded-xl"}`}
          >
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 bg-white/4 rounded-lg" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="border-b border-white/8 bg-white/[0.02]">
                    <tr>
                      <Th center>#</Th>
                      <Th>Winner</Th>
                      <Th>Loser</Th>
                      <Th>Mode</Th>
                      <Th center>Score</Th>
                      <Th right>ELO Change</Th>
                      <Th right>Date</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((match, i) => {
                      const winnerName = match.winnerId === match.player1Id ? match.player1Name : match.player2Name;
                      const loserName  = match.winnerId === match.player1Id ? match.player2Name : match.player1Name;
                      const winnerId   = match.winnerId === match.player1Id ? match.player1Id  : match.player2Id;
                      const loserId    = match.winnerId === match.player1Id ? match.player2Id  : match.player1Id;
                      const change     = Math.abs(match.ratingChange ?? 0);

                      return (
                        <tr key={match.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                          <td className="px-3 py-3 w-10 text-center">
                            <span className="text-xs font-semibold text-muted-foreground/50 tabular-nums">{i + 1}</span>
                          </td>

                          <td className="px-3 py-3 min-w-[160px]">
                            <div className="flex items-center gap-2">
                              <img src={`https://mc-heads.net/avatar/${encodeURIComponent(winnerName)}/24`}
                                alt={winnerName}
                                className="w-6 h-6 rounded bg-black flex-shrink-0"
                                onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/24"; }} />
                              <Link href={`/players/${winnerId}`}
                                className="font-bold text-sm text-green-400 hover:text-green-300 transition-colors truncate">
                                {winnerName}
                              </Link>
                              <span className="text-[9px] font-black bg-green-500/15 text-green-500 border border-green-500/25 px-1.5 py-0.5 rounded flex-shrink-0">W</span>
                            </div>
                          </td>

                          <td className="px-3 py-3 min-w-[160px]">
                            <div className="flex items-center gap-2">
                              <img src={`https://mc-heads.net/avatar/${encodeURIComponent(loserName)}/24`}
                                alt={loserName}
                                className="w-6 h-6 rounded opacity-60 bg-black flex-shrink-0"
                                onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/24"; }} />
                              <Link href={`/players/${loserId}`}
                                className="font-medium text-sm text-red-400/70 hover:text-red-300 transition-colors truncate">
                                {loserName}
                              </Link>
                              <span className="text-[9px] font-black bg-red-500/15 text-red-500 border border-red-500/25 px-1.5 py-0.5 rounded flex-shrink-0">L</span>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <GamemodeIcon name={match.gamemodeName} size={16} />
                              <span className="text-[10px] font-bold text-muted-foreground">{match.gamemodeName}</span>
                            </div>
                          </td>

                          <td className="px-3 py-3 text-center">
                            {match.score
                              ? <span className="font-mono text-xs text-white/60 font-bold">{match.score}</span>
                              : <span className="text-muted-foreground/25">—</span>}
                          </td>

                          <td className="px-3 py-3 text-right">
                            {change > 0 ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="font-mono text-xs font-black text-green-400">+{change}</span>
                                <span className="text-muted-foreground/30 text-xs">/</span>
                                <span className="font-mono text-xs font-black text-red-400">-{change}</span>
                              </div>
                            ) : <span className="text-muted-foreground/25">—</span>}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                              {format(new Date(match.playedAt), "MMM d, yyyy")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center text-sm text-muted-foreground">
                {search ? `No matches found with "${search}".` : "No matches yet."}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
