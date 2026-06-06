import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ShieldCheck, Crown, Star } from "lucide-react";

type Tester = {
  id: number;
  username: string;
  displayName: string | null;
  role: string;
  avatar: string | null;
};

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  owner:     { label: "OWNER",     icon: <Crown className="w-3 h-3" />,       cls: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10" },
  admin:     { label: "ADMIN",     icon: <ShieldCheck className="w-3 h-3" />, cls: "text-red-400 border-red-500/40 bg-red-500/10" },
  moderator: { label: "MOD",       icon: <ShieldCheck className="w-3 h-3" />, cls: "text-blue-400 border-blue-500/40 bg-blue-500/10" },
  tester:    { label: "TESTER",    icon: <Star className="w-3 h-3" />,        cls: "text-violet-400 border-violet-500/40 bg-violet-500/10" },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? { label: role.toUpperCase(), icon: null, cls: "text-white/50 border-white/20 bg-white/5" };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Tests() {
  const { data: testers, isLoading } = useQuery<Tester[]>({
    queryKey: ["testers"],
    queryFn: async () => {
      const res = await fetch("/api/testers");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-screen-xl px-4 flex flex-col gap-10">

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-2xl font-black text-white tracking-tight">Tier Testers</h1>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Official testers who evaluate and certify player tiers.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl bg-white/4" />
            ))}
          </div>
        ) : testers && testers.length > 0 ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
          >
            {testers.map(tester => (
              <motion.div key={tester.id} variants={item}>
                <div className="bg-card border border-border/50 hover:border-primary/40 rounded-xl p-4 flex flex-col items-center gap-3 transition-all duration-200 hover:shadow-[0_0_18px_rgba(120,40,200,0.18)] hover:-translate-y-0.5">
                  {tester.avatar ? (
                    <img
                      src={tester.avatar}
                      alt={tester.username}
                      className="w-14 h-14 rounded-full border-2 border-border/60 object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/${encodeURIComponent(tester.username)}/56`; }}
                    />
                  ) : (
                    <img
                      src={`https://mc-heads.net/avatar/${encodeURIComponent(tester.username)}/56`}
                      alt={tester.username}
                      className="w-14 h-14 rounded-full border-2 border-border/60"
                      onError={e => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/56"; }}
                    />
                  )}
                  <div className="flex flex-col items-center gap-1.5 min-w-0 w-full">
                    <span className="font-black text-sm text-white truncate w-full text-center">
                      {tester.displayName || tester.username}
                    </span>
                    <RoleBadge role={tester.role} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="py-16 text-center text-sm text-muted-foreground/40 bg-card border border-border/40 rounded-xl">
            No testers assigned yet.
          </div>
        )}

      </div>
    </div>
  );
}
