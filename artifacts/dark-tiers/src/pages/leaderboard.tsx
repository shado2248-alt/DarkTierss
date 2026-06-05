import { useState } from "react";
import { useGetLeaderboard, useListGamemodes, GetLeaderboardSortBy } from "@workspace/api-client-react";
import { Link } from "wouter";
import { TierBadge } from "@/components/ui/tier-badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function Leaderboard() {
  const [gamemodeId, setGamemodeId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<GetLeaderboardSortBy>('rating');
  
  const { data: gamemodes } = useListGamemodes();
  const { data, isLoading } = useGetLeaderboard({ 
    gamemodeId, 
    search: search || undefined, 
    sortBy,
    limit: 50 
  });

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Leaderboard</h1>
            <p className="text-muted-foreground text-sm">Top players ranked by ELO.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search players..." 
                className="pl-9 bg-black/40 border-white/10 text-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as GetLeaderboardSortBy)}>
              <SelectTrigger className="w-32 bg-black/40 border-white/10 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="wins">Wins</SelectItem>
                <SelectItem value="matches">Matches</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {gamemodes && gamemodes.length > 0 && (
          <Tabs value={gamemodeId?.toString() || "all"} onValueChange={(v) => setGamemodeId(v === "all" ? undefined : parseInt(v))}>
            <TabsList className="bg-black/40 border border-white/10 p-1 mb-2 w-full justify-start overflow-x-auto h-auto flex-wrap">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All Modes</TabsTrigger>
              {gamemodes.map(mode => (
                <TabsTrigger key={mode.id} value={mode.id.toString()} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {mode.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        <div className="glass-card rounded-xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-black/60 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-bold">Rank</th>
                  <th className="px-6 py-4 font-bold">Player</th>
                  <th className="px-6 py-4 font-bold">Tier</th>
                  <th className="px-6 py-4 font-bold text-right">Rating</th>
                  <th className="px-6 py-4 font-bold text-right hidden sm:table-cell">Win/Loss</th>
                  <th className="px-6 py-4 font-bold text-right hidden md:table-cell">Matches</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-6 bg-white/5" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-32 bg-white/5" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-12 bg-white/5" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto bg-white/5" /></td>
                      <td className="px-6 py-4 text-right hidden sm:table-cell"><Skeleton className="h-4 w-16 ml-auto bg-white/5" /></td>
                      <td className="px-6 py-4 text-right hidden md:table-cell"><Skeleton className="h-4 w-8 ml-auto bg-white/5" /></td>
                    </tr>
                  ))
                ) : data?.entries && data.entries.length > 0 ? (
                  data.entries.map((entry, index) => (
                    <tr key={`${entry.playerId}-${index}`} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-mono font-bold text-muted-foreground group-hover:text-white">#{entry.rank}</td>
                      <td className="px-6 py-4">
                        <Link href={`/players/${entry.playerId}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                          <img src={`https://mc-heads.net/avatar/${entry.uuid}/32`} alt={entry.username} className="w-8 h-8 rounded bg-black" />
                          <span className="font-bold">{entry.username}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <TierBadge tierName={entry.tierName} tierColor={entry.tierColor} />
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-primary">{entry.rating}</td>
                      <td className="px-6 py-4 text-right hidden sm:table-cell">
                        <span className="text-green-400 font-medium">{entry.wins}W</span>
                        <span className="text-muted-foreground mx-1">-</span>
                        <span className="text-red-400 font-medium">{entry.losses}L</span>
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground hidden md:table-cell">{entry.totalMatches}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No players found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
