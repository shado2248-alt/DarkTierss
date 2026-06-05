import { useState } from "react";
import { useListPlayers } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Players() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListPlayers({ search: search || undefined, limit: 50 });

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Players</h1>
            <p className="text-muted-foreground text-sm">Browse all registered players.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search players by name..." 
              className="pl-9 bg-black/40 border-white/10 text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="glass-card p-4 rounded-xl h-24 animate-pulse bg-white/5 border-white/10" />
            ))
          ) : data?.players && data.players.length > 0 ? (
            data.players.map((player) => (
              <Link key={player.id} href={`/players/${player.id}`}>
                <div className="glass-card p-4 rounded-xl flex items-center gap-4 hover:border-primary/50 transition-all hover:bg-white/5 cursor-pointer group">
                  <img src={`https://mc-heads.net/avatar/${player.uuid}/48`} alt={player.username} className="w-12 h-12 rounded bg-black" />
                  <div>
                    <div className="font-bold text-white group-hover:text-primary transition-colors">{player.username}</div>
                    <div className="text-xs text-muted-foreground uppercase">{player.region}</div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground glass-card rounded-xl">
              No players found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
