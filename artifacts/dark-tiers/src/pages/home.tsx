import { useGetStats, useGetRecentActivity, useListAnnouncements, useGetLeaderboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { TierBadge } from "../components/ui/tier-badge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Home() {
  const { data: stats } = useGetStats();
  const { data: activity } = useGetRecentActivity();
  const { data: announcements } = useListAnnouncements({ params: { limit: 3 } });
  const { data: leaderboard } = useGetLeaderboard({ params: { limit: 5 } });

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">

        {/* Hero */}
        <header className="text-center space-y-6">
          <h1 className="text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-purple-300">
            DARK TIERS
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            The elite Minecraft PvP ranking platform. Track your rating, climb the tiers, and prove your dominance.
          </p>
          <div className="flex gap-4 justify-center pt-2">
            <Link href="/leaderboard" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-md font-semibold transition-colors">
              View Leaderboard
            </Link>
            <a href="https://discord.gg/" target="_blank" rel="noreferrer" className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-3 rounded-md font-semibold transition-colors">
              Join Discord
            </a>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-8 rounded-xl flex flex-col items-center gap-2">
            <span className="text-5xl font-bold text-white">{stats?.totalPlayers ?? 0}</span>
            <span className="text-sm text-muted-foreground uppercase tracking-widest">Ranked Players</span>
          </div>
          <div className="glass-card p-8 rounded-xl flex flex-col items-center gap-2">
            <span className="text-5xl font-bold text-white">{stats?.totalMatches ?? 0}</span>
            <span className="text-sm text-muted-foreground uppercase tracking-widest">Matches Played</span>
          </div>
          <div className="glass-card p-8 rounded-xl flex flex-col items-center gap-2">
            <span className="text-5xl font-bold text-white">{stats?.totalTests ?? 0}</span>
            <span className="text-sm text-muted-foreground uppercase tracking-widest">Tier Tests</span>
          </div>
        </div>

        {/* Main grid: leaderboard preview + recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Top Ranked */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bold text-white text-lg">Top Ranked</h2>
              <Link href="/leaderboard" className="text-sm text-primary hover:text-primary/80 transition-colors">
                View All
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {leaderboard?.entries?.map((entry, i) => (
                <div key={entry.playerId} className="px-6 py-3 flex items-center gap-4 hover:bg-white/5 transition-colors">
                  <span className="text-muted-foreground text-sm w-6 text-center font-mono">#{i + 1}</span>
                  <img
                    src={`https://mc-heads.net/avatar/${entry.uuid}/32`}
                    alt={entry.username}
                    className="w-8 h-8 rounded"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/32"; }}
                  />
                  <Link href={`/players/${entry.playerId}`} className="flex-1 font-medium text-white hover:text-primary transition-colors text-sm">
                    {entry.username}
                  </Link>
                  <TierBadge tierName={entry.tierName ?? null} tierColor={entry.tierColor ?? null} />
                  <span className="text-primary font-mono text-sm">{entry.rating}</span>
                </div>
              ))}
              {(!leaderboard?.entries || leaderboard.entries.length === 0) && (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">No ranked players yet.</div>
              )}
            </div>
          </div>

          {/* Recent Matches */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bold text-white text-lg">Recent Matches</h2>
              <Link href="/matches" className="text-sm text-primary hover:text-primary/80 transition-colors">
                View All
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {activity?.recentMatches?.map((match) => (
                <div key={match.id} className="px-6 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                  <span className="text-xs text-muted-foreground w-14 flex-shrink-0">{match.gamemodeName}</span>
                  <span className="text-green-400 font-medium text-sm flex-1">{match.player1Id === match.winnerId ? match.player1Name : match.player2Name}</span>
                  <span className="text-muted-foreground text-xs">vs</span>
                  <span className="text-red-400 font-medium text-sm flex-1 text-right">{match.player1Id === match.winnerId ? match.player2Name : match.player1Name}</span>
                  <span className="text-muted-foreground font-mono text-xs w-10 text-right">{match.score}</span>
                  {match.ratingChange != null && (
                    <span className="text-xs text-primary font-mono w-10 text-right">+{match.ratingChange}</span>
                  )}
                </div>
              ))}
              {(!activity?.recentMatches || activity.recentMatches.length === 0) && (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">No recent matches.</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Promotions + Announcements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Tier Promotions */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-bold text-white text-lg">Recent Promotions</h2>
            </div>
            <div className="divide-y divide-white/5">
              {activity?.recentPromotions?.map((promo) => (
                <div key={promo.id} className="px-6 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                  <Link href={`/players/${promo.playerId}`} className="font-medium text-white hover:text-primary transition-colors text-sm flex-1">
                    {promo.playerName}
                  </Link>
                  <span className="text-muted-foreground text-xs">{promo.gamemodeName}</span>
                  <span className="text-muted-foreground text-xs">promoted to</span>
                  <TierBadge tierName={promo.toTier} tierColor="#9333ea" />
                  <span className="text-muted-foreground text-xs">{formatDate(promo.promotedAt)}</span>
                </div>
              ))}
              {(!activity?.recentPromotions || activity.recentPromotions.length === 0) && (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">No recent promotions.</div>
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bold text-white text-lg">Announcements</h2>
              <Link href="/announcements" className="text-sm text-primary hover:text-primary/80 transition-colors">
                View All
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {announcements?.announcements?.map((ann) => (
                <Link key={ann.id} href={`/announcements/${ann.id}`} className="block px-6 py-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-white text-sm">{ann.title}</span>
                    {ann.isPinned && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex-shrink-0">PINNED</span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{ann.content}</p>
                  <span className="text-muted-foreground text-xs mt-1 block">{formatDate(ann.createdAt)}</span>
                </Link>
              ))}
              {(!announcements?.announcements || announcements.announcements.length === 0) && (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">No announcements yet.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
