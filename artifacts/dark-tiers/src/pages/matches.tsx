import { useListMatches } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Matches() {
  const { data, isLoading } = useListMatches({ limit: 50 });

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Match History</h1>
          <p className="text-muted-foreground text-sm">Recent battles across the platform.</p>
        </div>

        <div className="glass-card rounded-xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-black/60 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Mode</th>
                  <th className="px-6 py-4 font-bold">Winner</th>
                  <th className="px-6 py-4 font-bold">Loser</th>
                  <th className="px-6 py-4 font-bold">Score</th>
                  <th className="px-6 py-4 font-bold text-right">Rating Δ</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5 animate-pulse bg-white/5">
                      <td colSpan={6} className="h-16"></td>
                    </tr>
                  ))
                ) : data?.matches && data.matches.length > 0 ? (
                  data.matches.map((match) => {
                    const winnerName = match.winnerId === match.player1Id ? match.player1Name : match.player2Name;
                    const loserName = match.winnerId === match.player1Id ? match.player2Name : match.player1Name;
                    const winnerId = match.winnerId === match.player1Id ? match.player1Id : match.player2Id;
                    const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;

                    return (
                      <tr key={match.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-muted-foreground">{format(new Date(match.playedAt), 'MMM d, yyyy HH:mm')}</td>
                        <td className="px-6 py-4 font-medium">{match.gamemodeName}</td>
                        <td className="px-6 py-4">
                          <Link href={`/players/${winnerId}`} className="font-bold text-green-400 hover:text-green-300">
                            {winnerName}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/players/${loserId}`} className="font-medium text-red-400 hover:text-red-300">
                            {loserName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold">{match.score}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold">
                          {match.ratingChange ? `±${Math.abs(match.ratingChange)}` : "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No matches found.
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
