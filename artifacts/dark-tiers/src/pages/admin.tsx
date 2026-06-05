import { useState } from "react";
import { useGetMe, useGetAdminStats, useListUsers, useUpdateUser, useGetAnalytics, useListPlayers, useDeletePlayer, useResetPlayerRating, useChangePlayerTier, useListMatches, useCreateMatch, useDeleteMatch, useListTests, useUpdateTest, useListAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement, useListGamemodes, useListTiers } from "@workspace/api-client-react";
import { Redirect } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Swords, ShieldCheck, Megaphone, LayoutDashboard, Trash2, CheckCircle, XCircle, RefreshCw, Pin, PinOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AdminTab = "overview" | "users" | "players" | "matches" | "tests" | "announcements";

const ROLES = ["user", "tester", "moderator", "admin", "owner"];
const TIER_COLORS = ["#eab308", "#6366f1", "#f97316", "#22c55e", "#ec4899", "#14b8a6", "#f43f5e", "#a855f7", "#06b6d4", "#84cc16"];

const tabList: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
  { id: "players", label: "Players", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: "matches", label: "Matches", icon: <Swords className="w-4 h-4" /> },
  { id: "tests", label: "Tier Tests", icon: <CheckCircle className="w-4 h-4" /> },
  { id: "announcements", label: "News", icon: <Megaphone className="w-4 h-4" /> },
];

function StatCard({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className="glass-card p-5 rounded-xl border border-white/10 flex flex-col gap-1">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`text-3xl font-black ${color ?? "text-white"}`}>{value ?? "..."}</div>
    </div>
  );
}

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: stats } = useGetAdminStats();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const { data: analytics } = useGetAnalytics({ period });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Users" value={stats?.totalUsers} />
        <StatCard label="Total Players" value={stats?.totalPlayers} />
        <StatCard label="Total Matches" value={stats?.totalMatches} />
        <StatCard label="Pending Tests" value={stats?.pendingTests} color="text-yellow-400" />
        <StatCard label="Active Staff" value={stats?.activeStaff} color="text-primary" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Analytics</h2>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-xl border border-white/10">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Match Activity</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={analytics?.matchActivity ?? []}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: "#666" }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5 rounded-xl border border-white/10">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analytics?.userGrowth ?? []}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: "#666" }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Bar dataKey="value" fill="#7c3aed" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5 rounded-xl border border-white/10">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Tier Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={analytics?.tierDistribution ?? []} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={70}>
                {(analytics?.tierDistribution ?? []).map((_, i) => (
                  <Cell key={i} fill={TIER_COLORS[i % TIER_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5 rounded-xl border border-white/10">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Gamemode Popularity</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analytics?.gamemodePopularity ?? []} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: "#666" }} allowDecimals={false} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 10, fill: "#aaa" }} width={50} />
              <Tooltip contentStyle={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Bar dataKey="value" fill="#6d28d9" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── USERS ─────────────────────────────────────────────────────────────────────
function UsersTab() {
  const [search, setSearch] = useState("");
  const { data, refetch } = useListUsers({ search: search || undefined, limit: 50 });
  const updateUser = useUpdateUser();

  const handleRoleChange = async (id: number, role: string) => {
    await updateUser.mutateAsync({ id, data: { role } });
    refetch();
  };
  const handleSuspend = async (id: number, isSuspended: boolean) => {
    await updateUser.mutateAsync({ id, data: { isSuspended } });
    refetch();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full md:w-72">
        <Input placeholder="Search users..." className="bg-black/40 border-white/10 text-white" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-black/40 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.users?.map(user => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="w-7 h-7 rounded bg-black" />
                      ) : (
                        <div className="w-7 h-7 rounded bg-white/10" />
                      )}
                      <span className="font-semibold text-white">{user.displayName || user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{(user as any).email ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Select value={user.role} onValueChange={v => handleRoleChange(user.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-28 bg-black/40 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                      user.isSuspended
                        ? "bg-red-500/15 text-red-400 border-red-500/30"
                        : "bg-green-500/15 text-green-400 border-green-500/30"
                    }`}>
                      {user.isSuspended ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSuspend(user.id, !user.isSuspended)}
                      className={`text-xs h-7 ${user.isSuspended ? "text-green-400 hover:text-green-300" : "text-red-400 hover:text-red-300"}`}
                    >
                      {user.isSuspended ? "Unsuspend" : "Suspend"}
                    </Button>
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
    await deletePlayer.mutateAsync({ id });
    refetch();
  };
  const handleReset = async (id: number, gamemodeId: number) => {
    await resetRating.mutateAsync({ id, data: { gamemodeId, newRating: 1000 } });
    refetch();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full md:w-72">
        <Input placeholder="Search players..." className="bg-black/40 border-white/10 text-white" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-black/40 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">UUID</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.players?.map(player => (
                <tr key={player.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://mc-heads.net/avatar/${player.uuid}/28`}
                        alt={player.username}
                        className="w-7 h-7 rounded bg-black"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/28"; }}
                      />
                      <span className="font-semibold text-white">{player.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground truncate max-w-[120px]">{player.uuid}</td>
                  <td className="px-4 py-3 text-xs">{player.region}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(player.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end flex-wrap">
                      {gamemodes?.slice(0, 2).map(gm => (
                        <Button
                          key={gm.id}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReset(player.id, gm.id)}
                          className="text-[10px] h-6 px-2 text-yellow-400 hover:text-yellow-300"
                          title={`Reset ${gm.name} rating`}
                        >
                          <RefreshCw className="w-3 h-3 mr-0.5" />{gm.name}
                        </Button>
                      ))}
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(player.id)} className="text-red-400 hover:text-red-300 h-6 px-2">
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
  const { data: players } = useListPlayers({ limit: 100 });
  const { data: gamemodes } = useListGamemodes();
  const deleteMatch = useDeleteMatch();
  const createMatch = useCreateMatch();
  const qc = useQueryClient();

  const [form, setForm] = useState({ gamemodeId: "", player1Id: "", player2Id: "", winnerId: "", score: "" });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createMatch.mutateAsync({
        data: {
          gamemodeId: parseInt(form.gamemodeId),
          player1Id: parseInt(form.player1Id),
          player2Id: parseInt(form.player2Id),
          winnerId: parseInt(form.winnerId),
          score: form.score,
        },
      });
      setForm({ gamemodeId: "", player1Id: "", player2Id: "", winnerId: "", score: "" });
      setShowForm(false);
      refetch();
      qc.invalidateQueries();
    } finally {
      setCreating(false);
    }
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this match?")) return;
    await deleteMatch.mutateAsync({ id });
    refetch();
  };

  const selectedPlayers = [form.player1Id, form.player2Id].filter(Boolean).map(id =>
    players?.players?.find(p => p.id === parseInt(id))
  ).filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Recent Matches</h3>
        <Button size="sm" onClick={() => setShowForm(v => !v)} className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs h-8">
          {showForm ? "Cancel" : "+ New Match"}
        </Button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="glass-card rounded-xl border border-white/10 p-5 grid grid-cols-2 md:grid-cols-3 gap-3"
        >
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Gamemode</label>
            <Select value={form.gamemodeId} onValueChange={v => setForm(f => ({ ...f, gamemodeId: v }))}>
              <SelectTrigger className="bg-black/40 border-white/10 text-white text-sm h-8">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {gamemodes?.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Player 1</label>
            <Select value={form.player1Id} onValueChange={v => setForm(f => ({ ...f, player1Id: v }))}>
              <SelectTrigger className="bg-black/40 border-white/10 text-white text-sm h-8">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {players?.players?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.username}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Player 2</label>
            <Select value={form.player2Id} onValueChange={v => setForm(f => ({ ...f, player2Id: v }))}>
              <SelectTrigger className="bg-black/40 border-white/10 text-white text-sm h-8">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {players?.players?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.username}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Winner</label>
            <Select value={form.winnerId} onValueChange={v => setForm(f => ({ ...f, winnerId: v }))}>
              <SelectTrigger className="bg-black/40 border-white/10 text-white text-sm h-8">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {selectedPlayers.map(p => p && <SelectItem key={p.id} value={String(p.id)}>{p.username}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Score</label>
            <Input placeholder="e.g. 3-1" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} className="bg-black/40 border-white/10 text-white h-8 text-sm" required />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={creating} className="w-full h-8 bg-primary hover:bg-primary/90 text-xs">
              {creating ? "Creating..." : "Create Match"}
            </Button>
          </div>
        </motion.form>
      )}

      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-black/40 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Winner</th>
                <th className="px-4 py-3">Loser</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {data?.matches?.map(match => {
                const winnerName = match.winnerId === match.player1Id ? match.player1Name : match.player2Name;
                const loserName = match.winnerId === match.player1Id ? match.player2Name : match.player1Name;
                return (
                  <tr key={match.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-2 text-xs font-bold text-primary">{match.gamemodeName}</td>
                    <td className="px-4 py-2 text-green-400 font-semibold text-sm">{winnerName}</td>
                    <td className="px-4 py-2 text-red-400 text-sm">{loserName}</td>
                    <td className="px-4 py-2 font-mono text-sm">{match.score}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{match.ratingChange != null ? `±${Math.abs(match.ratingChange)}` : "-"}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(match.playedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(match.id)} className="text-red-400 hover:text-red-300 h-6 w-6 p-0">
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
  const { data, refetch } = useListTests({ limit: 50 });
  const updateTest = useUpdateTest();

  const handleStatus = async (id: number, status: string) => {
    await updateTest.mutateAsync({ id, data: { status } });
    refetch();
  };

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
            <tr>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Requested Tier</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tester</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.tests?.map(test => (
              <tr key={test.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3 font-semibold text-white">{test.playerName}</td>
                <td className="px-4 py-3 text-xs font-bold text-primary">{test.gamemodeName}</td>
                <td className="px-4 py-3 font-bold text-primary">{test.requestedTier}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${statusCls[test.status] ?? "bg-white/10 text-white border-white/20"}`}>
                    {test.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{test.testerName ?? "-"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(test.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    {test.status !== "approved" && (
                      <Button size="sm" variant="ghost" onClick={() => handleStatus(test.id, "approved")} className="h-6 px-2 text-green-400 hover:text-green-300 text-[10px]">
                        <CheckCircle className="w-3 h-3 mr-0.5" />Approve
                      </Button>
                    )}
                    {test.status !== "in_progress" && (
                      <Button size="sm" variant="ghost" onClick={() => handleStatus(test.id, "in_progress")} className="h-6 px-2 text-blue-400 hover:text-blue-300 text-[10px]">
                        In Progress
                      </Button>
                    )}
                    {test.status !== "rejected" && (
                      <Button size="sm" variant="ghost" onClick={() => handleStatus(test.id, "rejected")} className="h-6 px-2 text-red-400 hover:text-red-300 text-[10px]">
                        <XCircle className="w-3 h-3 mr-0.5" />Reject
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
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "news", isPinned: false });
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createAnnouncement.mutateAsync({
        data: {
          title: form.title,
          content: form.content,
          type: form.type as any,
          authorId: userId,
          isPinned: form.isPinned,
        },
      });
      setForm({ title: "", content: "", type: "news", isPinned: false });
      setShowForm(false);
      refetch();
    } finally {
      setCreating(false);
    }
  };
  const handleTogglePin = async (id: number, isPinned: boolean) => {
    await updateAnnouncement.mutateAsync({ id, data: { isPinned: !isPinned } });
    refetch();
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this announcement?")) return;
    await deleteAnnouncement.mutateAsync({ id });
    refetch();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Announcements</h3>
        <Button size="sm" onClick={() => setShowForm(v => !v)} className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs h-8">
          {showForm ? "Cancel" : "+ New Announcement"}
        </Button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="glass-card rounded-xl border border-white/10 p-5 flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Title</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" className="bg-black/40 border-white/10 text-white" required />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Type</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["news", "update", "event", "maintenance"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} className="rounded" />
                Pin this announcement
              </label>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Content</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Write your announcement..."
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={creating} className="bg-primary hover:bg-primary/90 text-sm w-fit self-end">
            {creating ? "Publishing..." : "Publish"}
          </Button>
        </motion.form>
      )}

      <div className="flex flex-col gap-3">
        {data?.announcements?.map(ann => (
          <div key={ann.id} className="glass-card rounded-xl border border-white/10 p-4 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm">{ann.title}</span>
                {ann.isPinned && <span className="text-[10px] font-black bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded">PINNED</span>}
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{ann.type}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
              <span className="text-[10px] text-muted-foreground/60">{ann.authorName} · {new Date(ann.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" onClick={() => handleTogglePin(ann.id, !!ann.isPinned)} className="h-7 w-7 p-0 text-muted-foreground hover:text-primary">
                {ann.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(ann.id)} className="h-7 w-7 p-0 text-red-400 hover:text-red-300">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN ADMIN PAGE ────────────────────────────────────────────────────────────
export default function Admin() {
  const { data: user, isLoading } = useGetMe();
  const [tab, setTab] = useState<AdminTab>("overview");

  if (isLoading) return <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user || (user.role !== "admin" && user.role !== "owner")) return <Redirect to="/" />;

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-violet-500">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Full platform management and control.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {tabList.map(t => (
            <motion.button
              key={t.id}
              onClick={() => setTab(t.id)}
              whileTap={{ scale: 0.94 }}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0 transition-colors duration-200 ${
                tab === t.id ? "text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="admin-tab-pill"
                  className="absolute inset-0 bg-primary/25 border border-primary/40 rounded-lg"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">{t.icon}{t.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "overview" && <OverviewTab />}
          {tab === "users" && <UsersTab />}
          {tab === "players" && <PlayersTab />}
          {tab === "matches" && <MatchesTab />}
          {tab === "tests" && <TestsTab />}
          {tab === "announcements" && <AnnouncementsTab userId={user.id} />}
        </motion.div>

      </div>
    </div>
  );
}
