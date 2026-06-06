import { useState, useRef } from "react";
import { useListTests, useListGamemodes } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ShieldCheck, Clock, CheckCircle, XCircle, Loader, Filter } from "lucide-react";

const EASE = [0.25, 0.1, 0.25, 1] as const;

type Status = "all" | "pending" | "in_progress" | "approved" | "rejected" | "accepted" | "cancelled";

const STATUS_CONFIG: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
  pending:     { cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",  label: "Pending",     icon: <Clock className="w-3 h-3" /> },
  accepted:    { cls: "bg-purple-500/15 text-purple-400 border-purple-500/30",  label: "Accepted",    icon: <CheckCircle className="w-3 h-3" /> },
  in_progress: { cls: "bg-blue-500/15 text-blue-400 border-blue-500/30",        label: "In Progress", icon: <Loader className="w-3 h-3" /> },
  approved:    { cls: "bg-green-500/15 text-green-400 border-green-500/30",     label: "Approved",    icon: <CheckCircle className="w-3 h-3" /> },
  rejected:    { cls: "bg-red-500/15 text-red-400 border-red-500/30",           label: "Rejected",    icon: <XCircle className="w-3 h-3" /> },
  cancelled:   { cls: "bg-gray-500/15 text-gray-400 border-gray-500/30",        label: "Cancelled",   icon: <XCircle className="w-3 h-3" /> },
};

const FILTER_TABS: { id: Status; label: string }[] = [
  { id: "all",         label: "All" },
  { id: "pending",     label: "Pending" },
  { id: "accepted",    label: "Accepted" },
  { id: "in_progress", label: "In Progress" },
  { id: "approved",    label: "Approved" },
  { id: "rejected",    label: "Rejected" },
];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { cls: "bg-white/10 text-white border-white/20", label: status, icon: null };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${cfg.cls}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function TestCard({ test, index }: { test: any; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const cfg = STATUS_CONFIG[test.status];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.25), ease: EASE }}
      className={`glass-card rounded-2xl overflow-hidden border transition-colors duration-300
        ${test.status === "approved" ? "border-green-500/25 hover:border-green-400/50"
        : test.status === "rejected" ? "border-red-500/20 hover:border-red-400/40"
        : "border-white/10 hover:border-primary/40"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/30 border-b border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
          {test.gamemodeName}
        </span>
        <StatusBadge status={test.status} />
      </div>

      {/* Body */}
      <div className="flex items-center gap-4 px-4 py-3.5">
        <div className="relative flex-shrink-0">
          <img
            src={`https://mc-heads.net/body/${encodeURIComponent(test.playerName)}/60`}
            alt={test.playerName}
            className="h-16 w-auto object-contain drop-shadow-lg"
            onError={e => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/${encodeURIComponent(test.playerName)}/48`; }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/players/${test.playerId}`} className="font-black text-base text-white hover:text-primary transition-colors truncate block">
            {test.playerName}
          </Link>

          <div className="flex items-center gap-1.5 mt-1">
            <ShieldCheck className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground">
              Requesting <span className="font-black text-primary">{test.requestedTier}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
            {test.testerName && (
              <span className="text-[10px] text-muted-foreground">
                Tester: <span className="text-white/60 font-semibold">{test.testerName}</span>
              </span>
            )}
            {!test.testerName && test.status === "pending" && (
              <span className="text-[10px] text-yellow-500/70">Awaiting tester assignment</span>
            )}
            <span className="text-[10px] text-muted-foreground/50">
              {format(new Date(test.createdAt), "MMM d, yyyy")}
            </span>
          </div>

          {test.notes && (
            <div className="mt-2 text-[10px] text-muted-foreground/70 bg-white/5 rounded px-2 py-1 border border-white/5 truncate">
              {test.notes}
            </div>
          )}
        </div>

        {/* Result pill */}
        {test.result && (
          <div className={`flex-shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border text-center
            ${test.result === "pass" ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"}`}>
            {test.result === "pass" ? "PASS" : "FAIL"}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Tests() {
  const [statusFilter, setStatusFilter] = useState<Status>("all");
  const [gamemodeId, setGamemodeId] = useState<number | null>(null);

  const { data: gamemodes } = useListGamemodes();
  const { data, isLoading } = useListTests({
    status: statusFilter !== "all" ? statusFilter : undefined,
    gamemodeId: gamemodeId ?? undefined,
    limit: 100,
  });

  const tests = data?.tests ?? [];
  const counts: Record<string, number> = {};
  tests.forEach(t => { counts[t.status] = (counts[t.status] ?? 0) + 1; });

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-violet-500">
            Tier Testers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data ? `${data.total} test${data.total !== 1 ? "s" : ""} · ${counts["pending"] ?? 0} pending` : "Active and recent tier test requests."}
          </p>
        </motion.div>

        {/* Stats chips */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.07 }}
          className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none"
        >
          {(["pending", "in_progress", "approved", "rejected"] as Status[]).map(s => {
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold flex-shrink-0 ${cfg.cls}`}>
                {cfg.icon}
                <span className="capitalize">{cfg.label}</span>
                <span className="font-black">{counts[s] ?? 0}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Status filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none flex-1">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-colors duration-200 ${
                  statusFilter === tab.id ? "text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                {statusFilter === tab.id && (
                  <motion.span layoutId="test-status-tab"
                    className="absolute inset-0 bg-primary/25 border border-primary/40 rounded-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Gamemode filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setGamemodeId(null)}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-colors duration-200 ${
                gamemodeId === null ? "text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              {gamemodeId === null && (
                <motion.span layoutId="test-gm-tab"
                  className="absolute inset-0 bg-white/10 border border-white/15 rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <span className="relative z-10 flex items-center gap-1"><Filter className="w-3 h-3" />All</span>
            </button>
            {gamemodes?.map(gm => (
              <button
                key={gm.id}
                onClick={() => setGamemodeId(gm.id)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-colors duration-200 ${
                  gamemodeId === gm.id ? "text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                {gamemodeId === gm.id && (
                  <motion.span layoutId="test-gm-tab"
                    className="absolute inset-0 bg-white/10 border border-white/15 rounded-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <span className="relative z-10">{gm.name}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Cards */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 bg-white/5 rounded-2xl" />)}
            </motion.div>
          ) : tests.length > 0 ? (
            <motion.div key={`${statusFilter}-${gamemodeId}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map((test, i) => <TestCard key={test.id} test={test} index={i} />)}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="glass-card rounded-xl py-20 text-center text-muted-foreground">
              No {statusFilter !== "all" ? statusFilter.replace("_", " ") : ""} tier tests found.
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
