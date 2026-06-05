import { useListAnnouncements } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Announcements() {
  const { data, isLoading } = useListAnnouncements({ limit: 20 });

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-4xl px-4 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">News & Announcements</h1>
          <p className="text-muted-foreground text-sm">Latest updates from the DARK TIERS platform.</p>
        </div>

        <div className="flex flex-col gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-card p-6 rounded-xl flex flex-col gap-2 bg-white/5 animate-pulse border-white/10">
                <Skeleton className="h-6 w-3/4 bg-white/10" />
                <Skeleton className="h-4 w-1/4 bg-white/10" />
              </div>
            ))
          ) : data?.announcements && data.announcements.length > 0 ? (
            data.announcements.map((announcement) => (
              <Link key={announcement.id} href={`/announcements/${announcement.id}`}>
                <div className="glass-card p-6 rounded-xl flex flex-col gap-2 border-white/10 hover:border-primary/50 transition-colors group cursor-pointer">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{announcement.title}</h2>
                    {announcement.isPinned && (
                      <span className="px-2 py-1 text-xs font-bold bg-primary/20 text-primary rounded">PINNED</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="uppercase font-semibold tracking-wider">{announcement.type}</span> • {format(new Date(announcement.createdAt), 'MMMM d, yyyy')} • By {announcement.authorName}
                  </div>
                  <p className="text-muted-foreground mt-2 line-clamp-2">{announcement.content}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground glass-card rounded-xl">
              No announcements found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
