import { useListAnnouncements } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function Announcements() {
  const { data, isLoading } = useListAnnouncements({ limit: 20 });

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-4xl px-4 flex flex-col gap-6">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-violet-500">
            News & Announcements
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Latest updates from the DARK TIERS platform.</p>
        </motion.div>

        <div className="flex flex-col gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 bg-white/5 rounded-2xl" />
            ))
          ) : data?.announcements && data.announcements.length > 0 ? (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-4"
            >
              {data.announcements.map((announcement) => (
                <motion.div key={announcement.id} variants={cardVariants}>
                  <Link href={`/announcements/${announcement.id}`}>
                    <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-[0_0_20px_rgba(120,40,200,0.15)]">
                      <div className="flex justify-between items-start gap-3">
                        <h2 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                          {announcement.title}
                        </h2>
                        {announcement.isPinned && (
                          <span className="px-2 py-1 text-xs font-bold bg-primary/20 text-primary rounded border border-primary/30 flex-shrink-0">
                            PINNED
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="uppercase font-semibold tracking-wider">{announcement.type}</span>
                        {" "}&middot;{" "}
                        {format(new Date(announcement.createdAt), "MMMM d, yyyy")}
                        {" "}&middot;{" "}
                        By {announcement.authorName}
                      </div>
                      <p className="text-muted-foreground mt-3 line-clamp-2 text-sm">{announcement.content}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center text-muted-foreground glass-card rounded-xl"
            >
              No announcements found.
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
