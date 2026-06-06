import { useState, useEffect } from "react";
import {
  useGetMe, useGetAdminStats, useListUsers, useUpdateUser, useGetAnalytics,
  useListPlayers, useDeletePlayer, useResetPlayerRating, useChangePlayerTier,
  useListMatches, useCreateMatch, useDeleteMatch,
  useListTests, useUpdateTest,
  useListAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement,
  useListGamemodes, useCreateGamemode, useUpdateGamemode, useDeleteGamemode,
  useListTiers, useCreateTier, useUpdateTier, useDeleteTier,
} from "@workspace/api-client-react";
import { Redirect } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  Users, Swords, ShieldCheck, Megaphone, LayoutDashboard, Trash2,
  CheckCircle, XCircle, RefreshCw, Pin, PinOff, Globe, Gamepad2, Layers,
  Pencil, Save, X, Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AdminTab = "overview" | "users" | "players" | "matches" | "tests" | "announcements" | "gamemodes" | "tiers";

const COLORS = ["#8b5cf6", "#6366f1", "#f97316", "#22c55e", "#ec4899", "#14b8a6", "#f43f5e", "#a855f7", "#06b6d4", "#84cc16"];

function rolesFor(myRole: string): string[] {
  if (myRole === "owner") return ["user", "tester", "moderator", "admin", "owner"];
  if (myRole === "admin") return ["user", "tester"];
  return [];
}

const ALL_TABS: { id: AdminTab; label: string; icon: React.ReactNode; minRole: string }[] = [
  { id: "overview",      label: "Overview",   icon: <LayoutDashboard className="w-4 h-4" />, minRole: "admin" },
  { id: "users",         label: "Users",      icon: <Users className="w-4 h-4" />,           minRole: "admin" },
  { id: "players",       label: "Players",    icon: <ShieldCheck className="w-4 h-4" />,     minRole: "admin" },
  { id: "matches",       label: "Matches",    icon: <Swords className="w-4 h-4" />,          minRole: "tester" },
  { id: "tests",         label: "Tests",      icon: <CheckCircle className="w-4 h-4" />,     minRole: "tester" },
  { id: "announcements", label: "News",       icon: <Megaphone className="w-4 h-4" />,       minRole: "tester" },
  { id: "gamemodes",     label: "Gamemodes",  icon: <Gamepad2 className="w-4 h-4" />,        minRole: "admin" },
  { id: "tiers",         label: "Tiers",      icon: <Layers className="w-4 h-4" />,          minRole: "admin" },
];

const ROLE_RANK: Record<string, number> = { user: 0, tester: 1, moderator: 2, admin: 3, owner: 4 };
function hasAccess(myRole: string, minRole: string) {
  return (ROLE_RANK[myRole] ?? 0) >= (ROLE_RANK[minRole] ?? 99);
}

function StatCard({ label, value, color, sub }: { label: string; value: any; color?: string; sub?: string }) {
  return (
    <div className="glass-card p-5 rounded-xl border border-white/10 flex flex-col gap-1">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`text-3xl font-black ${color ?? "text-white"}`}>{value ?? "..."}</div>
      {sub && <div className="text-[10px] text-muted-foreground/60">{sub}</div>}
    </div>
  );
}

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: stats } = useGetAdminStats();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const { data: analytics } = useGetAnalytics({ period });
  const s = stats as any;
  const a = analytics as any;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Users" value={s?.totalUsers} />
        <StatCard label="Total Players" value={s?.totalPlayers} />
        <StatCard label="Total Matches" value={s?.totalMatches} />
        <StatCard label="Pending Tests" value={s?.pendingTests} color="text-yellow-400" />
        <StatCard label="Active Staff" value={s?.activeStaff} color="text-primary" />
        <StatCard label="In Progress" value={s?.inProgressTests} color="text-blue-400" sub="tests" />
        <StatCard label="Testers" value={s?.totalTesters} color="text-cyan-400" />
        <StatCard label="Announcements" value={s?.totalAnnouncements} />
        <StatCard label="Tier Promotions" value={s?.totalPromotions} color="text-purple-400" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Analytics</h2>
        <Select value={period} onValueChange={v => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-28 bg-black/40 border-white/10 text-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[
          { title: "Match Activity", data: a?.matchActivity, type: "line" },
          { title: "User Growth", data: a?.userGrowth, type: "bar" },
        ].map(({ title, data, type }) => (
          <div key={title} className="glass-card p-5 rounded-xl border border-white/10">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={160}>
              {type === "line" ? (
                <LineChart data={data ?? []}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: "#666" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <BarChart data={data ?? []}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: "#666" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                  <Bar dataKey="value" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ))}

        <div className="glass-card p-5 rounded-xl border border-white/10">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Tier Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={a?.tierDistribution ?? []} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={65}>
                {(a?.tierDistribution ?? []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5 rounded-xl border border-white/10">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Gamemode Popularity</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={a?.gamemodePopularity ?? []} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: "#666" }} allowDecimals={false} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 10, fill: "#aaa" }} width={55} />
              <Tooltip contentStyle={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Bar dataKey="value" fill="#6d28d9" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5 rounded-xl border border-white/10 lg:col-span-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
            <Globe className="w-3 h-3 inline mr-1" />Regional Distribution
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={a?.regionalDistribution ?? []} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: "#666" }} allowDecimals={false} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 10, fill: "#aaa" }} width={55} />
              <Tooltip contentStyle={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Bar dataKey="value" fill="#0891b2" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── USERS ─────────────────────────────────────────────────────────────────────
function UsersTab({ myRole }: { myRole: string }) {
  const [search, setSearch] = useState("");
  const { data, refetch } = useListUsers({ search: search || undefined, limit: 50 });
  const updateUser = useUpdateUser();
  const availableRoles = rolesFor(myRole);

  const handleRole = async (id: number, role: string) => { await updateUser.mutateAsync({ id, data: { role: role as any } }); refetch(); };
  const handleSuspend = async (id: number, isSuspended: boolean) => { await updateUser.mutateAsync({ id, data: { isSuspended } }); refetch(); };

  return (
    <div className="flex flex-col gap-4">
      <Input placeholder="Search users..." className="bg-black/40 border-white/10 text-white w-full md:w-72" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-black/40 border-b border-white/10">
              <tr>
                {["User", "Email", "Role", "Status", "Joined", ""].map(h => <th key={h} className="px-4 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data?.users?.map(user => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.avatar ? <img src={user.avatar} alt="" className="w-7 h-7 rounded bg-black" /> : <div className="w-7 h-7 rounded bg-white/10" />}
                      <span className="font-semibold text-white">{user.displayName || user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{(user as any).email ?? "-"}</td>
                  <td className="px-4 py-3">
                    {availableRoles.length > 0 ? (
                      <Select value={user.role} onValueChange={v => handleRole(user.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-28 bg-black/40 border-white/10 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>{availableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground">{user.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${user.isSuspended ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-green-500/15 text-green-400 border-green-500/30"}`}>
                      {user.isSuspended ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {myRole === "owner" || myRole === "admin" ? (
                      <Button size="sm" variant="ghost" onClick={() => handleSuspend(user.id, !user.isSuspended)}
                        className={`text-xs h-7 ${user.isSuspended ? "text-green-400 hover:text-green-300" : "text-red-400 hover:text-red-300"}`}>
                        {user.isSuspended ? "Unsuspend" : "Suspend"}
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── PLAYERS ───────────────────────────────────────────────────────────────────
function PlayersTab() {
  const [search, setSearch] = useState("");
  const { data, refetch } = useListPlayers({ search: search || undefined, limit: 50 });
  const { data: gamemodes } = useListGamemodes();
  const deletePlayer = useDeletePlayer();
  const resetRating = useResetPlayerRating();

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this player and all their data?")) return;
    await deletePlayer.mutateAsync({ id }); refetch();
  };
  const handleReset = async (id: number) => {
    const gmId = gamemodes?.[0]?.id;
    if (!gmId) return;
    await resetRating.mutateAsync({ id, data: { gamemodeId: gmId, newRating: 1000 } }); refetch();
  };

  return (
    <div className="flex flex-col gap-4">
      <Input placeholder="Search players..." className="bg-black/40 border-white/10 text-white w-full md:w-72" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-black/40 border-b border-white/10">
              <tr>{["Player", "UUID", "Region", "Joined", ""].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {data?.players?.map(player => (
                <tr key={player.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={`https://mc-heads.net/avatar/${player.uuid}/28`} alt={player.username} className="w-7 h-7 rounded bg-black"
                        onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/28"; }} />
                      <span className="font-semibold text-white">{player.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground truncate max-w-[120px]">{player.uuid}</td>
                  <td className="px-4 py-3 text-xs">{player.region}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(player.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => handleReset(player.id)} className="text-yellow-400 hover:text-yellow-300 h-6 px-2 text-[10px]">
                        <RefreshCw className="w-3 h-3 mr-0.5" />Reset
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(player.id)} className="text-red-400 hover:text-red-300 h-6 w-6 p-0">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── MATCHES ───────────────────────────────────────────────────────────────────
function MatchesTab() {
  const { data, refetch } = useListMatches({ limit: 50 });
  const { data: players } = useListPlayers({ limit: 200 });
  const { data: gamemodes } = useListGamemodes();
  const deleteMatch = useDeleteMatch();
  const createMatch = useCreateMatch();
  const qc = useQueryClient();
  const [form, setForm] = useState({ gamemodeId: "", player1Id: "", player2Id: "", winnerId: "", score: "" });
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true);
    try {
      await createMatch.mutateAsync({ data: { gamemodeId: +form.gamemodeId, player1Id: +form.player1Id, player2Id: +form.player2Id, winnerId: +form.winnerId, score: form.score } });
      setForm({ gamemodeId: "", player1Id: "", player2Id: "", winnerId: "", score: "" });
      setShowForm(false); refetch(); qc.invalidateQueries();
    } finally { setCreating(false); }
  };

  const eligible = [form.player1Id, form.player2Id].filter(Boolean).map(id => players?.players?.find(p => p.id === +id)).filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{data?.total ?? 0} total matches</span>
        <Button size="sm" onClick={() => setShowForm(v => !v)} className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs h-8">
          {showForm ? "Cancel" : <><Plus className="w-3.5 h-3.5 mr-1" />New Match</>}
        </Button>
      </div>

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleCreate}
          className="glass-card rounded-xl border border-white/10 p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Gamemode", field: "gamemodeId", items: gamemodes?.map(g => ({ id: g.id, name: g.name })) },
            { label: "Player 1", field: "player1Id", items: players?.players?.map(p => ({ id: p.id, name: p.username })) },
            { label: "Player 2", field: "player2Id", items: players?.players?.map(p => ({ id: p.id, name: p.username })) },
            { label: "Winner", field: "winnerId", items: eligible?.map((p: any) => ({ id: p.id, name: p.username })) },
          ].map(({ label, field, items }) => (
            <div key={field}>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{label}</label>
              <Select value={(form as any)[field]} onValueChange={v => setForm(f => ({ ...f, [field]: v }))}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white text-sm h-8"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{items?.map((i: any) => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ))}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Score</label>
            <Input placeholder="3-1" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} className="bg-black/40 border-white/10 text-white h-8 text-sm" required />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={creating} className="w-full h-8 bg-primary text-xs">{creating ? "Creating..." : "Create"}</Button>
          </div>
        </motion.form>
      )}

      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-black/40 border-b border-white/10">
              <tr>{["Mode", "Winner", "Loser", "Score", "ELO", "Date", ""].map(h => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>
              {data?.matches?.map(match => {
                const winner = match.winnerId === match.player1Id ? match.player1Name : match.player2Name;
                const loser = match.winnerId === match.player1Id ? match.player2Name : match.player1Name;
                return (
                  <tr key={match.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-2 text-xs font-bold text-primary">{match.gamemodeName}</td>
                    <td className="px-4 py-2 text-green-400 font-semibold text-sm">{winner}</td>
                    <td className="px-4 py-2 text-red-400 text-sm">{loser}</td>
                    <td className="px-4 py-2 font-mono text-sm">{match.score}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{match.ratingChange != null ? `±${Math.abs(match.ratingChange)}` : "-"}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(match.playedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <Button size="sm" variant="ghost" onClick={async () => { if (!confirm("Delete match?")) return; await deleteMatch.mutateAsync({ id: match.id }); refetch(); }}
                        className="text-red-400 hover:text-red-300 h-6 w-6 p-0"><Trash2 className="w-3 h-3" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── TESTS ─────────────────────────────────────────────────────────────────────
function TestsTab() {
  const { data, refetch } = useListTests({ limit: 100 });
  const updateTest = useUpdateTest();
  const [testers, setTesters] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/testers").then(r => r.json()).then(setTesters).catch(() => {});
  }, []);

  const handleStatus = async (id: number, status: string) => { await updateTest.mutateAsync({ id, data: { status: status as any } }); refetch(); };
  const handleAssign = async (id: number, testerId: number) => { await updateTest.mutateAsync({ id, data: { testerId } }); refetch(); };

  const statusCls: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    approved: "bg-green-500/15 text-green-400 border-green-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
    in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    accepted: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    cancelled: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-black/40 border-b border-white/10">
            <tr>{["Player", "Mode", "Tier Req.", "Status", "Assign Tester", "Notes", "Date", "Actions"].map(h => <th key={h} className="px-3 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {data?.tests?.map(test => (
              <tr key={test.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-3 py-3 font-semibold text-white text-sm">{test.playerName}</td>
                <td className="px-3 py-3 text-xs font-bold text-primary">{test.gamemodeName}</td>
                <td className="px-3 py-3 font-bold text-primary text-sm">{test.requestedTier}</td>
                <td className="px-3 py-3">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${statusCls[test.status] ?? "bg-white/10 text-white border-white/20"}`}>
                    {test.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <Select
                    value={test.testerId ? String(test.testerId) : "none"}
                    onValueChange={v => v !== "none" && handleAssign(test.id, +v)}
                  >
                    <SelectTrigger className="h-7 text-xs w-32 bg-black/40 border-white/10 text-white">
                      <SelectValue placeholder={test.testerName ?? "Unassigned"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {testers.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.username} ({t.role})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{test.notes ?? "-"}</td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{new Date(test.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-0.5">
                    {test.status !== "in_progress" && (
                      <Button size="sm" variant="ghost" onClick={() => handleStatus(test.id, "in_progress")} className="h-6 px-1.5 text-blue-400 hover:text-blue-300 text-[9px]">WIP</Button>
                    )}
                    {test.status !== "approved" && (
                      <Button size="sm" variant="ghost" onClick={() => handleStatus(test.id, "approved")} className="h-6 px-1.5 text-green-400 hover:text-green-300">
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                    )}
                    {test.status !== "rejected" && (
                      <Button size="sm" variant="ghost" onClick={() => handleStatus(test.id, "rejected")} className="h-6 px-1.5 text-red-400 hover:text-red-300">
                        <XCircle className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────
function AnnouncementsTab({ userId }: { userId: number }) {
  const { data, refetch } = useListAnnouncements({ limit: 50 });
  const createAnn = useCreateAnnouncement();
  const updateAnn = useUpdateAnnouncement();
  const deleteAnn = useDeleteAnnouncement();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "news", isPinned: false });
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true);
    try {
      await createAnn.mutateAsync({ data: { title: form.title, content: form.content, type: form.type as any, authorId: userId, isPinned: form.isPinned } });
      setForm({ title: "", content: "", type: "news", isPinned: false }); setShowForm(false); refetch();
    } finally { setCreating(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{data?.total ?? 0} posts</span>
        <Button size="sm" onClick={() => setShowForm(v => !v)} className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs h-8">
          {showForm ? "Cancel" : <><Plus className="w-3.5 h-3.5 mr-1" />New Post</>}
        </Button>
      </div>

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleCreate}
          className="glass-card rounded-xl border border-white/10 p-5 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Title</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" className="bg-black/40 border-white/10 text-white" required />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Type</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{["news", "update", "event", "maintenance"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} className="rounded" />
                Pin this post
              </label>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Content</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="Write announcement..."
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" required />
            </div>
          </div>
          <Button type="submit" disabled={creating} className="bg-primary hover:bg-primary/90 text-sm w-fit self-end">{creating ? "Publishing..." : "Publish"}</Button>
        </motion.form>
      )}

      <div className="flex flex-col gap-2">
        {data?.announcements?.map(ann => (
          <div key={ann.id} className="glass-card rounded-xl border border-white/10 p-4 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm">{ann.title}</span>
                {ann.isPinned && <span className="text-[10px] font-black bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded">PINNED</span>}
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{ann.type}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
              <span className="text-[10px] text-muted-foreground/50">{ann.authorName} · {new Date(ann.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" onClick={async () => { await updateAnn.mutateAsync({ id: ann.id, data: { isPinned: !ann.isPinned } }); refetch(); }} className="h-7 w-7 p-0 text-muted-foreground hover:text-primary">
                {ann.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={async () => { if (!confirm("Delete?")) return; await deleteAnn.mutateAsync({ id: ann.id }); refetch(); }} className="h-7 w-7 p-0 text-red-400 hover:text-red-300">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── GAMEMODES ─────────────────────────────────────────────────────────────────
function GamemodesTab() {
  const { data: gamemodes, refetch } = useListGamemodes();
  const create = useCreateGamemode();
  const update = useUpdateGamemode();
  const del = useDeleteGamemode();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", isActive: true });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "", description: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({ data: { name: form.name, slug: form.slug, description: form.description || undefined, isActive: form.isActive } });
    setForm({ name: "", slug: "", description: "", isActive: true }); setShowForm(false); refetch();
  };
  const startEdit = (gm: any) => { setEditId(gm.id); setEditForm({ name: gm.name, slug: gm.slug, description: gm.description ?? "" }); };
  const handleEdit = async (id: number) => {
    await update.mutateAsync({ id, data: { name: editForm.name, slug: editForm.slug, description: editForm.description || undefined } });
    setEditId(null); refetch();
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this gamemode? This will affect all related data.")) return;
    await del.mutateAsync({ id }); refetch();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{gamemodes?.length ?? 0} gamemodes</span>
        <Button size="sm" onClick={() => setShowForm(v => !v)} className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs h-8">
          {showForm ? "Cancel" : <><Plus className="w-3.5 h-3.5 mr-1" />Add Gamemode</>}
        </Button>
      </div>

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleCreate}
          className="glass-card rounded-xl border border-white/10 p-5 grid grid-cols-2 gap-3">
          {[
            { label: "Name", field: "name", placeholder: "e.g. Crystal" },
            { label: "Slug", field: "slug", placeholder: "e.g. crystal" },
            { label: "Description", field: "description", placeholder: "Optional description", span: 2 },
          ].map(({ label, field, placeholder, span }) => (
            <div key={field} className={span === 2 ? "col-span-2" : ""}>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{label}</label>
              <Input value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} className="bg-black/40 border-white/10 text-white" required={field !== "description"} />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            <label htmlFor="isActive" className="text-sm text-muted-foreground">Active</label>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full h-8 bg-primary text-xs">Create Gamemode</Button>
          </div>
        </motion.form>
      )}

      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-black/40 border-b border-white/10">
              <tr>{["Name", "Slug", "Description", "Status", ""].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {gamemodes?.map(gm => (
                <tr key={gm.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  {editId === gm.id ? (
                    <>
                      <td className="px-3 py-2"><Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="bg-black/60 border-white/10 text-white h-7 text-sm" /></td>
                      <td className="px-3 py-2"><Input value={editForm.slug} onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))} className="bg-black/60 border-white/10 text-white h-7 text-sm" /></td>
                      <td className="px-3 py-2"><Input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="bg-black/60 border-white/10 text-white h-7 text-sm" /></td>
                      <td />
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(gm.id)} className="h-6 px-2 text-green-400 hover:text-green-300 text-xs"><Save className="w-3 h-3 mr-0.5" />Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditId(null)} className="h-6 w-6 p-0 text-muted-foreground"><X className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-bold text-white">{gm.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{gm.slug}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{(gm as any).description ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${(gm as any).isActive !== false ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}>
                          {(gm as any).isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(gm)} className="h-6 w-6 p-0 text-muted-foreground hover:text-white"><Pencil className="w-3 h-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(gm.id)} className="h-6 w-6 p-0 text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── TIERS ─────────────────────────────────────────────────────────────────────
function TiersTab() {
  const { data: gamemodes } = useListGamemodes();
  const [selectedGm, setSelectedGm] = useState<number | null>(null);
  const gmId = selectedGm ?? (gamemodes?.[0]?.id ?? null);
  const { data: tiers, refetch } = useListTiers({ gamemodeId: gmId ?? undefined }, { query: { enabled: !!gmId } as any });
  const create = useCreateTier();
  const update = useUpdateTier();
  const del = useDeleteTier();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", rank: "", minRating: "", maxRating: "", color: "#8b5cf6" });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", minRating: "", maxRating: "", color: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmId) return;
    await create.mutateAsync({ data: { name: form.name, slug: form.slug, rank: +form.rank, minRating: +form.minRating, maxRating: form.maxRating ? +form.maxRating : undefined, color: form.color, gamemodeId: gmId } });
    setForm({ name: "", slug: "", rank: "", minRating: "", maxRating: "", color: "#8b5cf6" }); setShowForm(false); refetch();
  };
  const startEdit = (t: any) => { setEditId(t.id); setEditForm({ name: t.name, minRating: String(t.minRating), maxRating: t.maxRating != null ? String(t.maxRating) : "", color: t.color }); };
  const handleEdit = async (id: number) => {
    await update.mutateAsync({ id, data: { name: editForm.name, minRating: +editForm.minRating, maxRating: editForm.maxRating ? +editForm.maxRating : undefined, color: editForm.color } });
    setEditId(null); refetch();
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this tier?")) return;
    await del.mutateAsync({ id }); refetch();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1">
          {gamemodes?.map(gm => (
            <button key={gm.id} onClick={() => setSelectedGm(gm.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${gmId === gm.id ? "bg-primary/30 text-white border border-primary/50" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}>
              {gm.name}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowForm(v => !v)} className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs h-8">
          {showForm ? "Cancel" : <><Plus className="w-3.5 h-3.5 mr-1" />Add Tier</>}
        </Button>
      </div>

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleCreate}
          className="glass-card rounded-xl border border-white/10 p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Name", field: "name", placeholder: "e.g. HT1" },
            { label: "Slug", field: "slug", placeholder: "e.g. ht1" },
            { label: "Rank", field: "rank", placeholder: "1 (lower = better)", type: "number" },
            { label: "Min Rating", field: "minRating", placeholder: "0", type: "number" },
            { label: "Max Rating", field: "maxRating", placeholder: "Leave blank = no cap", type: "number" },
          ].map(({ label, field, placeholder, type }) => (
            <div key={field}>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{label}</label>
              <Input type={type ?? "text"} value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} className="bg-black/40 border-white/10 text-white" required={field !== "maxRating"} />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10" />
              <Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="bg-black/40 border-white/10 text-white flex-1" />
            </div>
          </div>
          <div className="col-span-2 md:col-span-3 flex justify-end">
            <Button type="submit" className="h-8 bg-primary text-xs px-6">Create Tier</Button>
          </div>
        </motion.form>
      )}

      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-black/40 border-b border-white/10">
              <tr>{["Rank", "Name", "Slug", "Min ELO", "Max ELO", "Color", ""].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {tiers?.map(tier => (
                <tr key={tier.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  {editId === tier.id ? (
                    <>
                      <td className="px-3 py-2 text-muted-foreground text-sm">#{tier.rank}</td>
                      <td className="px-3 py-2"><Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="bg-black/60 border-white/10 text-white h-7 text-sm w-20" /></td>
                      <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{tier.slug}</td>
                      <td className="px-3 py-2"><Input type="number" value={editForm.minRating} onChange={e => setEditForm(f => ({ ...f, minRating: e.target.value }))} className="bg-black/60 border-white/10 text-white h-7 text-sm w-20" /></td>
                      <td className="px-3 py-2"><Input type="number" value={editForm.maxRating} onChange={e => setEditForm(f => ({ ...f, maxRating: e.target.value }))} placeholder="—" className="bg-black/60 border-white/10 text-white h-7 text-sm w-20" /></td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <input type="color" value={editForm.color} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} className="w-6 h-6 rounded cursor-pointer bg-transparent" />
                          <span className="text-xs font-mono text-muted-foreground">{editForm.color}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(tier.id)} className="h-6 px-2 text-green-400 text-xs"><Save className="w-3 h-3 mr-0.5" />Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditId(null)} className="h-6 w-6 p-0 text-muted-foreground"><X className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-muted-foreground font-bold">#{tier.rank}</td>
                      <td className="px-4 py-3">
                        <span className="font-black text-sm px-2 py-0.5 rounded border" style={{ color: tier.color, borderColor: `${tier.color}40`, backgroundColor: `${tier.color}15` }}>
                          {tier.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tier.slug}</td>
                      <td className="px-4 py-3 font-mono text-sm text-white">{tier.minRating}</td>
                      <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{tier.maxRating ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: tier.color }} />
                          <span className="text-xs font-mono text-muted-foreground">{tier.color}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(tier)} className="h-6 w-6 p-0 text-muted-foreground hover:text-white"><Pencil className="w-3 h-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(tier.id)} className="h-6 w-6 p-0 text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Admin() {
  const { data: user, isLoading } = useGetMe();
  const myRole = (user as any)?.role ?? "user";
  const tabList = ALL_TABS.filter(t => hasAccess(myRole, t.minRole));
  const defaultTab = tabList[0]?.id ?? "matches";
  const [tab, setTab] = useState<AdminTab>(defaultTab);

  if (isLoading) return <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user || !hasAccess(myRole, "tester")) return <Redirect to="/" />;

  const panelTitle =
    myRole === "owner" ? "Owner Panel" :
    myRole === "admin" ? "Admin Panel" :
    "Staff Panel";

  const panelSub =
    myRole === "owner" ? "Full platform control — manage staff, players, and all content." :
    myRole === "admin" ? "Manage players, matches, tests, and promote testers." :
    "Post match results, manage tier tests, and write announcements.";

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-5">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-violet-500">
              {panelTitle}
            </h1>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border
              ${myRole === "owner" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
              : myRole === "admin" ? "text-red-400 bg-red-500/10 border-red-500/30"
              : "text-violet-400 bg-violet-500/10 border-violet-500/30"}`}>
              {myRole}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">{panelSub}</p>
        </motion.div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {tabList.map(t => (
            <motion.button key={t.id} onClick={() => setTab(t.id)} whileTap={{ scale: 0.94 }}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold flex-shrink-0 transition-colors duration-200 ${tab === t.id ? "text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}>
              {tab === t.id && (
                <motion.span layoutId="admin-tab-pill" className="absolute inset-0 bg-primary/25 border border-primary/40 rounded-lg"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }} />
              )}
              <span className="relative z-10 flex items-center gap-1.5">{t.icon}{t.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {tab === "overview" && <OverviewTab />}
          {tab === "users" && <UsersTab myRole={myRole} />}
          {tab === "players" && <PlayersTab />}
          {tab === "matches" && <MatchesTab />}
          {tab === "tests" && <TestsTab />}
          {tab === "announcements" && <AnnouncementsTab userId={user.id} />}
          {tab === "gamemodes" && <GamemodesTab />}
          {tab === "tiers" && <TiersTab />}
        </motion.div>

      </div>
    </div>
  );
}
