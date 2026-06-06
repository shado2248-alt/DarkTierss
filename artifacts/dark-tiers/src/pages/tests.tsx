import { useState } from "react";
import { useListTests, useListGamemodes } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Search } from "lucide-react";

type Status = "all" | "pending" | "in_progress" | "approved" | "rejected" | "accepted" | "cancelled";

const STATUS_CONFIG: Record<string, { cls: string; label: string }> = {
  pending:     { cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",  label: "Pending" },
  accepted:    { cls: "bg-purple-500/15 text-purple-400 border-purple-500/30",  label: "Accepted" },
  in_progress: { cls: "bg-blue-500/15 text-blue-400 border-blue-500/30",        label: "In Progress" },
  approved:    { cls: "bg-green-500/15 text-green-400 border-green-500/30",     label: "Approved" },
  rejected:    { cls: "bg-red-500/15 text-red-400 border-red-500/30",           label: "Rejected" },
  cancelled:   { cls: "bg-gray-500/15 text-gray-400 border-gray-500/30",        label: "Cancelled" },
};

const STATUS_TABS: { id: Status; label: string }[] = [
  { id: "all",         label: "All" },
  { id: "pending",     label: "Pending" },
  { id: "accepted",    label: "Accepted" },
  { id: "in_progress", label: "In Progress" },
  { id: "approved",    label: "Approved" },
  { id: "rejected",    label: "Rejected" },
];

function Th({ children, right, center }: { children: React.ReactNode; right?: boolean; center?: boolean }) {
  return (
    <th className={`px-3 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap select-none
      ${right ? "text-right" : center ? "text-center" : "text-left"}`}>
      {children}
    </th>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { cls: "bg-white/10 text-white border-white/20", label: status };
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function Tests() {
  const [statusFilter, setStatusFilter] = useState<Status>("all");
  const [gamemodeId, setGamemodeId]     = useState<number | null>(null);
  const [search, setSearch]             = useState("");

  const { data: gamemodes } = useListGamemodes();
  const { data, isLoading } = useListTests({
    status: statusFilter !== "all" ? statusFilter : undefined,
    gamemodeId: gamemodeId ?? undefined,
    limit: 100,
  });

  /* ── Tab sets ── */
  const statusTabs = STATUS_TABS;
  const gamemodeTabs = [
    { id: null as number | null, label: "All Modes" },
    ...(gamemodes?.map(g => ({ id: g.id, label: g.name })) ?? []),
  ];

  const filtered = (data?.tests ?? []).filter(t =>
    !search || t.playerName.toLowerCase().includes(search.toLowerCase())
  );

  const activeStatusIdx = statusTabs.findIndex(t => t.id === statusFilter);
  const activeGmIdx     = gamemodeTabs.findIndex(t => t.id === gamemodeId);

  /* ── Summary counts ── */
  const all = data?.tests ?? [];
  const counts: Record<string, number> = {};
  all.forEach(t => { counts[t.status] = (counts[t.status] ?? 0) + 1; });

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-screen-xl px-4 flex flex-col gap-0">

        {/* Header */}
        <div className="flex items-end justify-between pb-3">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Tier Testers</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data
                ? `${data.total} test${data.total !== 1 ? "s" : ""} · ${counts["pending"] ?? 0} pending`
                : "Active and recent tier test requests."}
            </p>
          </div>
          <div className="relative w-48 flex-shrink-0">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search player..."
              className="pl-8 h-8 text-xs bg-card border-border/50 text-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Dual tab rows: status (primary) + gamemode (secondary) */}
        <div className="flex flex-col gap-0">
          {/* Status tabs */}
          <div className="flex items-end gap-0 overflow-x-auto scrollbar-none">
            {statusTabs.map(tab => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`relative flex-shrink-0 px-5 py-2.5 text-xs font-bold whitespace-nowrap transition-colors
                    ${active
                      ? "text-white border border-border/50 border-b-0 rounded-t-lg -mb-px z-10 bg-card"
                      : "text-muted-foreground hover:text-white/80"}`}
                >
                  {tab.label}
                  {tab.id !== "all" && counts[tab.id] != null && (
                    <span className="ml-1.5 text-[9px] font-black text-muted-foreground/60">
                      {counts[tab.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Card with gamemode sub-tabs inside */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${statusFilter}-${gamemodeId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className={`border border-border/50 bg-card rounded-xl overflow-hidden
                ${activeStatusIdx === 0 ? "rounded-tl-none" : ""}`}
            >
              {/* Gamemode sub-tabs inside card header */}
              <div className="flex items-center gap-0 border-b border-white/6 overflow-x-auto scrollbar-none px-0">
                {gamemodeTabs.map(tab => {
                  const active = gamemodeId === tab.id;
                  return (
                    <button
                      key={tab.id ?? "all"}
                      onClick={() => setGamemodeId(tab.id)}
                      className={`flex-shrink-0 px-4 py-2.5 text-[11px] font-bold whitespace-nowrap transition-colors border-b-2 -mb-px
                        ${active
                          ? "text-primary border-primary"
                          : "text-muted-foreground hover:text-white/70 border-transparent"}`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Table */}
              {isLoading ? (
                <div className="p-4 space-y-1.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 bg-white/4 rounded-lg" />
                  ))}
                </div>
              ) : filtered.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead className="border-b border-white/8">
                      <tr>
                        <Th center>#</Th>
                        <Th>Player</Th>
                        <Th>Mode</Th>
                        <Th>Requesting</Th>
                        <Th>Status</Th>
                        <Th>Tester</Th>
                        <Th center>Result</Th>
                        <Th right>Date</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((test, i) => (
                        <tr key={test.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          {/* # */}
                          <td className="px-3 py-2.5 w-10 text-center">
                            <span className="text-xs font-semibold text-muted-foreground/50 tabular-nums">{i + 1}</span>
                          </td>

                          {/* Player */}
                          <td className="px-3 py-2.5 min-w-[160px]">
                            <div className="flex items-center gap-2">
                              <img
                                src={`https://mc-heads.net/avatar/${encodeURIComponent(test.playerName)}/24`}
                                alt={test.playerName}
                                className="w-6 h-6 rounded-md bg-black flex-shrink-0"
                                onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/24"; }}
                              />
                              <Link href={`/players/${test.playerId}`}
                                className="font-bold text-sm text-white/90 hover:text-primary transition-colors">
                                {test.playerName}
                              </Link>
                            </div>
                          </td>

                          {/* Mode */}
                          <td className="px-3 py-2.5">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/25">
                              {test.gamemodeName}
                            </span>
                          </td>

                          {/* Requesting tier */}
                          <td className="px-3 py-2.5">
                            <span className="text-sm font-black text-primary">{test.requestedTier}</span>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2.5">
                            <StatusBadge status={test.status} />
                          </td>

                          {/* Tester */}
                          <td className="px-3 py-2.5">
                            {test.testerName
                              ? <span className="text-xs text-white/60 font-semibold">{test.testerName}</span>
                              : <span className="text-muted-foreground/30 text-xs">Unassigned</span>}
                          </td>

                          {/* Result */}
                          <td className="px-3 py-2.5 text-center">
                            {test.result ? (
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border
                                ${test.result === "pass"
                                  ? "bg-green-500/15 text-green-400 border-green-500/30"
                                  : "bg-red-500/15 text-red-400 border-red-500/30"}`}>
                                {test.result === "pass" ? "PASS" : "FAIL"}
                              </span>
                            ) : <span className="text-muted-foreground/25 text-xs">—</span>}
                          </td>

                          {/* Date */}
                          <td className="px-3 py-2.5 text-right pr-5">
                            <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                              {format(new Date(test.createdAt), "MMM d, yyyy")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center text-sm text-muted-foreground">
                  No {statusFilter !== "all" ? statusFilter.replace("_", " ") : ""} tier tests found.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
