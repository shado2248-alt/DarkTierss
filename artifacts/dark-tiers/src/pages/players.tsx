import { useState } from "react";
import { useListPlayers } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
};

function RegionBadge({ region }: { region: string | null }) {
  if (!region) return null;
  const cls =
    region === "NA"
      ? "bg-red-500/20 text-red-300 border-red-500/30"
      : region === "EU"
      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
      : "bg-green-500/20 text-green-300 border-green-500/30";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cls}`}>{region}</span>
  );
}

export default function Players() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListPlayers({ search: search || undefined, limit: 50 });

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-violet-500">
              Players
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Browse all registered players.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players by name..."
              className="pl-9 bg-black/40 border-white/10 text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-48 bg-white/5 rounded-2xl" />
            ))}
          </div>
        ) : data?.players && data.players.length > 0 ? (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {data.players.map((player) => (
              <motion.div key={player.id} variants={cardVariants}>
                <Link href={`/players/${player.id}`}>
                  <div className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-[0_0_20px_rgba(120,40,200,0.2)]">
                    {/* Skin body display */}
                    <div className="bg-white/5 flex items-end justify-center pt-4 h-36 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
                      <img
                        src={`https://mc-heads.net/body/${player.uuid}/80`}
                        alt={player.username}
                        className="h-32 w-auto object-contain drop-shadow-md relative z-10 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/${player.uuid}/64`;
                        }}
                      />
                    </div>
                    {/* Info */}
                    <div className="px-4 py-3 border-t border-white/5 bg-black/20">
                      <div className="font-black text-sm text-white group-hover:text-primary transition-colors truncate">
                        {player.username}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <RegionBadge region={player.region} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-xl py-20 text-center text-muted-foreground"
          >
            No players found matching your search.
          </motion.div>
        )}
      </div>
    </div>
  );
}
