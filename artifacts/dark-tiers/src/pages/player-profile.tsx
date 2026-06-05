import { useGetPlayer } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { TierBadge } from "@/components/ui/tier-badge";
import { format } from "date-fns";

export default function PlayerProfile() {
  const [, params] = useRoute("/players/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  
  const { data: player, isLoading } = useGetPlayer(id, { query: { enabled: !!id } });

  if (isLoading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (!player) return <div className="flex-1 flex items-center justify-center">Player not found</div>;

  return (
    <div className="flex-1 flex flex-col items-center py-12">
      <div className="w-full max-w-7xl px-4 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center border-white/10 relative overflow-hidden">
            <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-primary/20 to-transparent" />
            <img 
              src={`https://mc-heads.net/body/${player.uuid}/100`} 
              alt={player.username} 
              className="w-24 h-auto drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] z-10 mb-4" 
            />
            <h1 className="text-2xl font-black text-white z-10">{player.username}</h1>
            <div className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mt-1 z-10">
              {player.region} {player.country && `• ${player.country}`}
            </div>
            <div className="text-xs text-muted-foreground/60 font-mono mt-4 truncate w-full z-10">
              {player.uuid}
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Stats Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Joined</span>
                <span className="text-sm font-medium">{format(new Date(player.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Matches</span>
                <span className="text-sm font-medium">{player.ratings?.reduce((acc, r) => acc + r.totalMatches, 0) || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Gamemode Ratings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {player.ratings?.map(rating => (
                <div key={rating.id} className="glass-card p-5 rounded-xl border-white/10 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-lg">{rating.gamemodeName}</div>
                    <TierBadge tierName={rating.tierName} tierColor={rating.tierColor} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-primary">{rating.rating}</span>
                    <span className="text-xs text-muted-foreground uppercase">ELO</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-white/5 mt-auto">
                    <div>
                      <span className="text-green-400">{rating.wins}W</span> - <span className="text-red-400">{rating.losses}L</span>
                    </div>
                    <div className="text-muted-foreground">Peak: {rating.peakRating}</div>
                  </div>
                </div>
              ))}
              {(!player.ratings || player.ratings.length === 0) && (
                <div className="col-span-full py-8 text-center text-muted-foreground glass-card rounded-xl">
                  No ratings yet.
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Recent Matches</h2>
            <div className="glass-card rounded-xl overflow-hidden border border-white/10">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-black/60 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3">Opponent</th>
                    <th className="px-4 py-3 text-right">Rating Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {player.recentMatches?.map(match => {
                    const isWinner = match.winnerId === player.id;
                    const opponent = match.player1Id === player.id ? match.player2Name : match.player1Name;
                    
                    return (
                      <tr key={match.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-muted-foreground">{format(new Date(match.playedAt), 'MMM d, HH:mm')}</td>
                        <td className="px-4 py-3 font-medium">{match.gamemodeName}</td>
                        <td className="px-4 py-3">
                          <span className={isWinner ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                            {isWinner ? "VICTORY" : "DEFEAT"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{opponent}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          {match.ratingChange ? (
                            <span className={match.ratingChange > 0 ? "text-green-400" : "text-red-400"}>
                              {match.ratingChange > 0 ? "+" : ""}{match.ratingChange}
                            </span>
                          ) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                  {(!player.recentMatches || player.recentMatches.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No recent matches.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
