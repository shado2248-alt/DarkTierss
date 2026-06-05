import { useListTests } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    pending:    { cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", label: "Pending" },
    approved:   { cls: "bg-green-500/15 text-green-400 border-green-500/30",   label: "Approved" },
    rejected:   { cls: "bg-red-500/15 text-red-400 border-red-500/30",         label: "Rejected" },
    in_review:  { cls: "bg-blue-500/15 text-blue-400 border-blue-500/30",      label: "In Review" },
  };
  const { cls, label } = map[status] ?? { cls: "bg-white/10 text-white border-white/20", label: status };
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  );
}

function ModeBadge({ name }: { name: string }) {
  return (
    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
      {name}
    </span>
  );
}

export default function Tests() {
  const { data, isLoading } = useListTests({ limit: 50 });

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-violet-500">
            Tier Testers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Active and recent tier test requests.</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 bg-white/5 rounded-2xl" />
            ))}
          </div>
        ) : data?.tests && data.tests.length > 0 ? (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {data.tests.map((test) => (
              <motion.div
                key={test.id}
                variants={cardVariants}
                className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/40 transition-colors duration-300"
              >
                {/* Header row */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-black/30 border-b border-white/5">
                  <ModeBadge name={test.gamemodeName} />
                  <StatusBadge status={test.status} />
                </div>

                {/* Body */}
                <div className="flex items-center gap-4 px-4 py-3.5">
                  <img
                    src={`https://mc-heads.net/body/${encodeURIComponent(test.playerName)}/60`}
                    alt={test.playerName}
                    className="h-14 w-auto object-contain flex-shrink-0 drop-shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/${encodeURIComponent(test.playerName)}/48`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/players/${test.playerId}`}
                      className="font-black text-base text-white hover:text-primary transition-colors truncate block"
                    >
                      {test.playerName}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <ShieldCheck className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        Requesting{" "}
                        <span className="font-bold text-primary">{test.requestedTier}</span>
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {test.testerName ? (
                        <>Tester: <span className="text-white/60 font-medium">{test.testerName}</span> · </>
                      ) : null}
                      {format(new Date(test.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-xl py-20 text-center text-muted-foreground"
          >
            No tier tests found.
          </motion.div>
        )}
      </div>
    </div>
  );
}
