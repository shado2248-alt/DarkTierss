import { useState, useEffect } from "react";
import {
  useGetMe, useGetAdminStats, useListUsers, useUpdateUser, useGetAnalytics,
  useListPlayers, useListMatches, useCreateMatch, useDeleteMatch,
  useListTests, useUpdateTest,
  useListAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement,
  useListGamemodes, useListTiers, useSetTierByUsername,
} from "@workspace/api-client-react";
import { Redirect } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  Users, Swords, ShieldCheck, Megaphone, LayoutDashboard, Trash2,
  CheckCircle, XCircle, Pin, PinOff, Globe, Layers,
  Plus, UserCog,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AdminTab = "overview" | "user-role" | "tier-result" | "users" | "matches" | "tests" | "announcements";

const COLORS = ["#8b5cf6", "#6366f1", "#f97316", "#22c55e", "#ec4899", "#14b8a6", "#f43f5e", "#a855f7", "#06b6d4", "#84cc16"];

const ROLE_RANK: Record<string, number> = { user: 0, tester: 1, moderator: 2, admin: 3, owner: 4 };
function hasAccess(myRole: string, minRole: string) {
  return (ROLE_RANK[myRole] ?? 0) >= (ROLE_RANK[minRole] ?? 99);
}

type TabGroup = {
  section: string;
  minRole: string;
  color: string;
  tabs: { id: AdminTab; label: string; icon: React.ReactNode }[];
};

const TAB_GROUPS: TabGroup[] = [
  {
    section: "Staff Panel",
    minRole: "tester",
    color: "text-violet-400 border-violet-500/40",
    tabs: [
      { id: "tier-result", label: "Tier Result", icon: <Layers className="w-4 h-4" /> },
      { id: "matches",     label: "Matches",     icon: <Swords className="w-4 h-4" /> },
      { id: "tests",       label: "Tests",       icon: <CheckCircle className="w-4 h-4" /> },
      { id: "announcements", label: "News",      icon: <Megaphone className="w-4 h-4" /> },
    ],
  },
  {
    section: "Admin Panel",
    minRole: "admin",
    color: "text-red-400 border-red-500/40",
    tabs: [
      { id: "overview",   label: "Overview",  icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: "user-role",  label: "User Role", icon: <UserCog className="w-4 h-4" /> },
    ],
  },
  {
    section: "Owner Panel",
    minRole: "owner",
    color: "text-yellow-400 border-yellow-500/40",
    tabs: [
      { id: "users", label: "Users & Staff", icon: <Users className="w-4 h-4" /> },
    ],
  },
];

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

// ── USER ROLE ─────────────────────────────────────────────────────────────────
function UserRoleTab({ myRole }: { myRole: string }) {
  const [search, setSearch] = useState("");
  const { data, refetch } = useListUsers({ search: search || undefined, limit: 100 });
  const updateUser = useUpdateUser();

  const handleRole = async (id: number, role: string) => {
    await updateUser.mutateAsync({ id, data: { role: role as any } });
    refetch();
  };

  const canAssign = (targetRole: string) => {
    if (myRole === "owner") return true;
    if (myRole === "admin") return ["user", "tester"].includes(targetRole);
    return false;
  };

  const roleOptions = myRole === "owner"
    ? ["user", "tester", "moderator", "admin"]
    : ["user", "tester"];

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
        Assign the <span className="text-primary font-bold">tester</span> role to any registered user, or revoke it back to user. Testers can post match results, manage tier tests, and assign tier results.
      </div>

      <Input
        placeholder="Search users by username..."
        className="bg-black/40 border-white/10 text-white w-full md:w-80"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-black/40 border-b border-white/10">
              <tr>
                {["Player", "Email", "Current Role", "Assign Role", "Joined"].map(h => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.users?.map(user => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.avatar
                        ? <img src={user.avatar} alt="" className="w-7 h-7 rounded bg-black" />
                        : <div className="w-7 h-7 rounded bg-white/10" />}
                      <span className="font-semibold text-white">{user.displayName || user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{(user as any).email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border
                      ${user.role === "owner"     ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                      : user.role === "admin"     ? "text-red-400 bg-red-500/10 border-red-500/30"
                      : user.role === "moderator" ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
                      : user.role === "tester"    ? "text-violet-400 bg-violet-500/10 border-violet-500/30"
                      :                             "text-muted-foreground bg-white/5 border-white/10"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canAssign(user.role) ? (
                      <Select value={user.role} onValueChange={v => handleRole(user.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-28 bg-black/40 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">Protected</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
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

// ── TIER RESULT ───────────────────────────────────────────────────────────────
function TierResultTab() {
  const { data: gamemodes } = useListGamemodes();
  const { data: tiersData } = useListTiers({});
  const setTier = useSetTierByUsername();

  const [form, setForm] = useState({ username: "", gamemodeId: "", tierId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; username?: string; tier?: string } | null>(null);
  const [history, setHistory] = useState<Array<{ username: string; gamemode: string; tier: string; color: string; created: boolean; time: string }>>([]);

  const allTiers = (tiersData as any[]) ?? [];
  const selectedGmId = form.gamemodeId ? Number(form.gamemodeId) : null;
  const tiersForGm = selectedGmId
    ? allTiers.filter((t: any) => t.gamemodeId === selectedGmId).sort((a: any, b: any) => a.rank - b.rank)
    : allTiers.sort((a: any, b: any) => a.rank - b.rank);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.gamemodeId || !form.tierId) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await setTier.mutateAsync({
        data: {
          username: form.username.trim(),
          gamemodeId: Number(form.gamemodeId),
          tierId: Number(form.tierId),
        },
      });
      const gm = gamemodes?.find(g => g.id === Number(form.gamemodeId));
      const tier = tiersForGm.find((t: any) => t.id === Number(form.tierId));
      setResult({ ok: true, message: (res as any).message ?? "Tier set successfully", username: (res as any).username, tier: tier?.name });
      setHistory(h => [
        {
          username: (res as any).username ?? form.username,
          gamemode: gm?.name ?? "—",
          tier: tier?.name ?? "—",
          color: tier?.color ?? "#8b5cf6",
          created: (res as any).created ?? false,
          time: new Date().toLocaleTimeString(),
        },
        ...h.slice(0, 19),
      ]);
      setForm(f => ({ ...f, username: "", tierId: "" }));
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? "Failed to set tier";
      setResult({ ok: false, message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="glass-card rounded-xl border border-white/10 p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-black text-white">Assign Tier Result</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Enter a Minecraft username — if the player is not yet registered on the site, they will be automatically added. Their tier will appear on the leaderboard immediately.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
              Minecraft Username
            </label>
            <Input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="e.g. Technoblade"
              className="bg-black/40 border-white/10 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                Gamemode
              </label>
              <Select
                value={form.gamemodeId}
                onValueChange={v => setForm(f => ({ ...f, gamemodeId: v, tierId: "" }))}
              >
                <SelectTrigger className="bg-black/40 border-white/10 text-white">
                  <SelectValue placeholder="Select gamemode..." />
                </SelectTrigger>
                <SelectContent>
                  {gamemodes?.map(gm => (
                    <SelectItem key={gm.id} value={String(gm.id)}>{gm.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                Tier
              </label>
              <Select
                value={form.tierId}
                onValueChange={v => setForm(f => ({ ...f, tierId: v }))}
                disabled={tiersForGm.length === 0}
              >
                <SelectTrigger className="bg-black/40 border-white/10 text-white">
                  <SelectValue placeholder="Select tier..." />
                </SelectTrigger>
                <SelectContent>
                  {tiersForGm.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      <span style={{ color: t.color }} className="font-black mr-1">{t.name}</span>
                      <span className="text-muted-foreground text-xs">({t.minRating}+ ELO)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg px-4 py-3 text-sm font-semibold border ${
                result.ok
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : "bg-red-500/10 text-red-400 border-red-500/30"
              }`}
            >
              {result.message}
            </motion.div>
          )}

          <Button
            type="submit"
            disabled={submitting || !form.username.trim() || !form.gamemodeId || !form.tierId}
            className="bg-primary hover:bg-primary/90 font-bold h-10"
          >
            {submitting ? "Applying..." : "Apply Tier Result"}
          </Button>
        </form>
      </div>

      {history.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Results This Session</h3>
          <div className="flex flex-col gap-1.5">
            {history.map((h, i) => (
              <div key={i} className="glass-card rounded-lg border border-white/8 px-4 py-2.5 flex items-center gap-3">
                <img
                  src={`https://mc-heads.net/avatar/${encodeURIComponent(h.username)}/28`}
                  alt={h.username}
                  className="w-7 h-7 rounded bg-black flex-shrink-0"
                  onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/28"; }}
                />
                <span className="font-semibold text-white flex-1">{h.username}</span>
                <span className="text-xs text-muted-foreground">{h.gamemode}</span>
                <span className="font-black text-sm px-2 py-0.5 rounded border" style={{ color: h.color, borderColor: `${h.color}40`, backgroundColor: `${h.color}15` }}>
                  {h.tier}
                </span>
                {h.created && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border text-cyan-400 bg-cyan-500/10 border-cyan-500/30">
                    New Player
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground/40">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── USERS ─────────────────────────────────────────────────────────────────────
function UsersTab({ myRole }: { myRole: string }) {
  const [search, setSearch] = useState("");
  const { data, refetch } = useListUsers({ search: search || undefined, limit: 50 });
  const updateUser = useUpdateUser();

  const rolesFor = (role: string) => {
    if (myRole === "owner") return ["user", "tester", "moderator", "admin", "owner"];
    if (myRole === "admin") return ["user", "tester"];
    return [];
  };

  const handleRole = async (id: number, role: string) => {
    await updateUser.mutateAsync({ id, data: { role: role as any } });
    refetch();
  };
  const handleSuspend = async (id: number, isSuspended: boolean) => {
    await updateUser.mutateAsync({ id, data: { isSuspended } });
    refetch();
  };

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
              {data?.users?.map(user => {
                const availableRoles = rolesFor(user.role);
                return (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.avatar ? <img src={user.avatar} alt="" className="w-7 h-7 rounded bg-black" /> : <div className="w-7 h-7 rounded bg-white/10" />}
                        <span className="font-semibold text-white">{user.displayName || user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{(user as any).email ?? "—"}</td>
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
                      {(myRole === "owner" || myRole === "admin") ? (
                        <Button size="sm" variant="ghost" onClick={() => handleSuspend(user.id, !user.isSuspended)}
                          className={`text-xs h-7 ${user.isSuspended ? "text-green-400 hover:text-green-300" : "text-red-400 hover:text-red-300"}`}>
                          {user.isSuspended ? "Unsuspend" : "Suspend"}
                        </Button>
                      ) : null}
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
                    <td className="px-4 py-2 text-xs text-muted-foreground">{match.ratingChange != null ? `±${Math.abs(match.ratingChange)}` : "—"}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(match.playedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <Button size="sm" variant="ghost"
                        onClick={async () => { if (!confirm("Delete match?")) return; await deleteMatch.mutateAsync({ id: match.id }); refetch(); }}
                        className="text-red-400 hover:text-red-300 h-6 w-6 p-0">
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
  const { data, refetch } = useListTests({ limit: 100 });
  const updateTest = useUpdateTest();
  const [testers, setTesters] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/testers").then(r => r.json()).then(setTesters).catch(() => {});
  }, []);

  const handleStatus = async (id: number, status: string) => { await updateTest.mutateAsync({ id, data: { status: status as any } }); refetch(); };
  const handleAssign = async (id: number, testerId: number) => { await updateTest.mutateAsync({ id, data: { testerId } }); refetch(); };

  const statusCls: Record<string, string> = {
    pending:     "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    approved:    "bg-green-500/15 text-green-400 border-green-500/30",
    rejected:    "bg-red-500/15 text-red-400 border-red-500/30",
    in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    accepted:    "bg-purple-500/15 text-purple-400 border-purple-500/30",
    cancelled:   "bg-gray-500/15 text-gray-400 border-gray-500/30",
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
                  <Select value={test.testerId ? String(test.testerId) : "none"} onValueChange={v => v !== "none" && handleAssign(test.id, +v)}>
                    <SelectTrigger className="h-7 text-xs w-32 bg-black/40 border-white/10 text-white">
                      <SelectValue placeholder={test.testerName ?? "Unassigned"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {testers.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.username} ({t.role})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{test.notes ?? "—"}</td>
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

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Admin() {
  const { data: user, isLoading } = useGetMe();
  const myRole = (user as any)?.role ?? "user";

  const visibleGroups = TAB_GROUPS.filter(g => hasAccess(myRole, g.minRole));
  const defaultTab = visibleGroups[0]?.tabs[0]?.id ?? "tier-result";
  const [tab, setTab] = useState<AdminTab>(defaultTab);

  if (isLoading) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="text-sm">Checking access...</span>
    </div>
  );
  if (!user) return <Redirect to="/login" />;
  if (!hasAccess(myRole, "tester")) return <Redirect to="/" />;

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-5">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-violet-500">
              Control Panel
            </h1>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border
              ${myRole === "owner"     ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
              : myRole === "admin"     ? "text-red-400 bg-red-500/10 border-red-500/30"
              : myRole === "moderator" ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
              :                          "text-violet-400 bg-violet-500/10 border-violet-500/30"}`}>
              {myRole}
            </span>
            {myRole === "owner" && (
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border text-green-400 bg-green-500/10 border-green-500/30">
                Full Access
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {myRole === "owner"
              ? "Full platform control across all 3 panels — staff, admin, and owner."
              : myRole === "admin" || myRole === "moderator"
              ? "Manage players, post match results, assign tiers, and view platform overview."
              : "Post match results, manage tier tests, assign tier results, and write announcements."}
          </p>
        </motion.div>

        {/* Grouped tab bar */}
        <div className="flex flex-col gap-2">
          {visibleGroups.map((group) => (
            <div key={group.section} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 px-1">
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${group.color.split(" ")[0]} opacity-70`}>
                  {group.section}
                </span>
                <div className={`flex-1 h-px border-t ${group.color.split(" ")[1]} opacity-30`} />
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {group.tabs.map(t => (
                  <motion.button
                    key={`${group.section}-${t.id}`}
                    onClick={() => setTab(t.id)}
                    whileTap={{ scale: 0.94 }}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold flex-shrink-0 transition-colors duration-200 ${
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
            </div>
          ))}
        </div>

        {/* Content */}
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {tab === "overview"      && <OverviewTab />}
          {tab === "user-role"     && <UserRoleTab myRole={myRole} />}
          {tab === "tier-result"   && <TierResultTab />}
          {tab === "users"         && <UsersTab myRole={myRole} />}
          {tab === "matches"       && <MatchesTab />}
          {tab === "tests"         && <TestsTab />}
          {tab === "announcements" && <AnnouncementsTab userId={(user as any).id} />}
        </motion.div>

      </div>
    </div>
  );
}
