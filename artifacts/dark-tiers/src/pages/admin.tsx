import { useGetMe, useGetAdminStats } from "@workspace/api-client-react";
import { Redirect } from "wouter";

export default function Admin() {
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const { data: stats, isLoading: isStatsLoading } = useGetAdminStats({ query: { enabled: !!user && (user.role === 'admin' || user.role === 'owner') } });

  if (isUserLoading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) return <Redirect to="/" />;

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Platform management and analytics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="glass-card p-6 rounded-xl border-white/10">
            <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Total Users</div>
            <div className="text-3xl font-bold text-white">{isStatsLoading ? '...' : stats?.totalUsers}</div>
          </div>
          <div className="glass-card p-6 rounded-xl border-white/10">
            <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Total Players</div>
            <div className="text-3xl font-bold text-white">{isStatsLoading ? '...' : stats?.totalPlayers}</div>
          </div>
          <div className="glass-card p-6 rounded-xl border-white/10">
            <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Total Matches</div>
            <div className="text-3xl font-bold text-white">{isStatsLoading ? '...' : stats?.totalMatches}</div>
          </div>
          <div className="glass-card p-6 rounded-xl border-white/10">
            <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Pending Tests</div>
            <div className="text-3xl font-bold text-yellow-400">{isStatsLoading ? '...' : stats?.pendingTests}</div>
          </div>
          <div className="glass-card p-6 rounded-xl border-white/10">
            <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Active Staff</div>
            <div className="text-3xl font-bold text-primary">{isStatsLoading ? '...' : stats?.activeStaff}</div>
          </div>
        </div>
        
        <div className="glass-card p-12 rounded-xl border-white/10 text-center text-muted-foreground mt-8">
          <p className="text-lg">Detailed admin controls and charts would be rendered here.</p>
          <p className="text-sm mt-2">Manage players, matches, tests, and platform settings.</p>
        </div>
      </div>
    </div>
  );
}
