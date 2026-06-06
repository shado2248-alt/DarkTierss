import { useState } from "react";
import { useListTests, useListGamemodes } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Search, ShieldCheck, Crown, Star } from "lucide-react";
import { GamemodeIcon } from "@/lib/gamemode-icons";

type Status = "all" | "pending" | "in_progress" | "approved" | "rejected" | "accepted" | "cancelled";

type Tester = {
  id: number;
  username: string;
  displayName: string | null;
  role: string;
  avatar: string | null;
};

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

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  owner:     { label: "Owner",     icon: <Crown className="w-3 h-3" />,       cls: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10" },
  admin:     { label: "Admin",     icon: <ShieldCheck className="w-3 h-3" />, cls: "text-red-400 border-red-500/40 bg-red-500/10" },
  moderator: { label: "Moderator", icon: <ShieldCheck className="w-3 h-3" />, cls: "text-blue-400 border-blue-500/40 bg-blue-500/10" },
  tester:    { label: "Tester",    icon: <Star className="w-3 h-3" />,        cls: "text-violet-400 border-violet-500/40 bg-violet-500/10" },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? { label: role, icon: null, cls: "text-white/50 border-white/20 bg-white/5" };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      {cfg.icon}{cfg.label}
    </span>
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

function Th({ children, right, center }: { children: React.ReactNode; right?: boolean; center?: boolean }) {
  return (
    <th className={`px-3 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap select-none
      ${right ? "text-right" : center ? "text-center" : "text-left"}`}>
      {children}
    </th>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

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

  const { data: testers, isLoading: testersLoading } = useQuery<Tester[]>({
    queryKey: ["testers"],
    queryFn: async () => {
      const res = await fetch("/api/testers");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const gamemodeTabs = [
    { id: null as number | null, label: "All Modes" },
    ...(gamemodes?.map(g => ({ id: g.id, label: g.name })) ?? []),
  ];

  const filtered = (data?.tests ?? []).filter(t =>
    !search || t.playerName.toLowerCase().includes(search.toLowerCase())
  );

  const activeStatusIdx = STATUS_TABS.findIndex(t => t.id === statusFilter);
  const all = data?.tests ?? [];
  const counts: Record<string, number> = {};
  all.forEach(t => { counts[t.status] = (counts[t.status] ?? 0) + 1; });

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-screen-xl px-4 flex flex-col gap-10">

        {/* ── TESTERS LIST ─────────────────────────────────── */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-5"
          >
            <h1 className="text-2xl font-black text-white tracking-tight">Tier Testers</h1>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Official testers who evaluate and certify player tiers.
            </p>
          </motion.div>

          {testersLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl bg-white/4" />
              ))}
            </div>
          ) : testers && testers.length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
            >
              {testers.map(tester => (
                <motion.div key={tester.id} variants={item}>
                  <div className="bg-card border border-border/50 hover:border-primary/40 rounded-xl p-4 flex flex-col items-center gap-3 transition-all duration-200 hover:shadow-[0_0_18px_rgba(120,40,200,0.18)] hover:-translate-y-0.5">
                    {tester.avatar ? (
                      <img
                        src={tester.avatar}
                        alt={tester.username}
                        className="w-14 h-14 rounded-full border-2 border-border/60 object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/${encodeURIComponent(tester.username)}/56`; }}
                      />
                    ) : (
                      <img
                        src={`https://mc-heads.net/avatar/${encodeURIComponent(tester.username)}/56`}
                        alt={tester.username}
                        className="w-14 h-14 rounded-full border-2 border-border/60"
                        onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/56"; }}
                      />
                    )}
                    <div className="flex flex-col items-center gap-1.5 min-w-0 w-full">
                      <span className="font-black text-sm text-white truncate w-full text-center">
                        {tester.displayName || tester.username}
                      </span>
                      <RoleBadge role={tester.role} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground/40 bg-card border border-border/40 rounded-xl">
              No testers assigned yet.
            </div>
          )}
        </section>

        {/* ── TEST REQUESTS TABLE ───────────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <h2 className="text-lg font-black text-white tracking-tight">Test Requests</h2>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {data
                  ? `${data.total} request${data.total !== 1 ? "s" : ""} · ${counts["pending"] ?? 0} pending`
                  : "Active and recent tier test requests."}
              </p>
            </motion.div>
            <div className="relative w-52 flex-shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
              <Input
                placeholder="Search player..."
                className="pl-8 h-8 text-xs bg-card border-border/40 text-white placeholder:text-muted-foreground/40"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Status tabs */}
          <div className="flex items-end gap-0 overflow-x-auto scrollbar-none">
            {STATUS_TABS.map(tab => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all
                    ${active
                      ? "text-white bg-card border border-border/60 border-b-0 rounded-t-xl -mb-px z-10"
                      : "text-muted-foreground hover:text-white/80 hover:bg-white/5 rounded-t-xl"
                    }`}
                >
                  <span>{tab.label}</span>
                  {tab.id !== "all" && counts[tab.id] != null && (
                    <span className="text-[9px] font-black text-muted-foreground/60 bg-white/10 px-1.5 py-0.5 rounded-full">
                      {counts[tab.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${statusFilter}-${gamemodeId}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`border border-border/60 bg-card overflow-hidden
                ${activeStatusIdx === 0 ? "rounded-b-xl rounded-tr-xl" : "rounded-xl"}`}
            >
              {/* Gamemode sub-tabs */}
              <div className="flex items-center gap-0 border-b border-white/6 overflow-x-auto scrollbar-none">
                {gamemodeTabs.map(tab => {
                  const active = gamemodeId === tab.id;
                  return (
                    <button
                      key={tab.id ?? "all"}
                      onClick={() => setGamemodeId(tab.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold whitespace-nowrap transition-colors border-b-2 -mb-px
                        ${active
                          ? "text-primary border-primary"
                          : "text-muted-foreground hover:text-white/70 border-transparent"}`}
                    >
                      {tab.id !== null && <GamemodeIcon name={tab.label} size={16} />}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {isLoading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-11 bg-white/4 rounded-lg" />
                  ))}
                </div>
              ) : filtered.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead className="border-b border-white/8 bg-white/[0.02]">
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
                        <motion.tr
                          key={test.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                          className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="px-3 py-3 w-10 text-center">
                            <span className="text-xs font-semibold text-muted-foreground/50 tabular-nums">{i + 1}</span>
                          </td>
                          <td className="px-3 py-3 min-w-[160px]">
                            <div className="flex items-center gap-2">
                              <img
                                src={`https://mc-heads.net/avatar/${encodeURIComponent(test.playerName)}/24`}
                                alt={test.playerName}
                                className="w-6 h-6 rounded bg-black flex-shrink-0"
                                onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/24"; }}
                              />
                              <Link href={`/players/${test.playerId}`}
                                className="font-bold text-sm text-white hover:text-primary transition-colors">
                                {test.playerName}
                              </Link>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <GamemodeIcon name={test.gamemodeName} size={16} />
                              <span className="text-[10px] font-bold text-muted-foreground">{test.gamemodeName}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-sm font-black text-primary">{test.requestedTier}</span>
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge status={test.status} />
                          </td>
                          <td className="px-3 py-3">
                            {test.testerName
                              ? <span className="text-xs text-white/60 font-semibold">{test.testerName}</span>
                              : <span className="text-muted-foreground/30 text-xs">Unassigned</span>}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {test.result ? (
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border
                                ${test.result === "pass"
                                  ? "bg-green-500/15 text-green-400 border-green-500/30"
                                  : "bg-red-500/15 text-red-400 border-red-500/30"}`}>
                                {test.result === "pass" ? "PASS" : "FAIL"}
                              </span>
                            ) : <span className="text-muted-foreground/25 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                              {format(new Date(test.createdAt), "MMM d, yyyy")}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center text-sm text-muted-foreground/40">
                  No {statusFilter !== "all" ? statusFilter.replace("_", " ") : ""} tier tests found.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

      </div>
    </div>
  );
}
