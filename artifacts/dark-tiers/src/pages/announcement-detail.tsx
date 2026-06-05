import { useGetAnnouncement } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

export default function AnnouncementDetail() {
  const [, params] = useRoute("/announcements/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  
  const { data: announcement, isLoading } = useGetAnnouncement(id, { query: { enabled: !!id } as any });

  if (isLoading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (!announcement) return <div className="flex-1 flex items-center justify-center">Announcement not found</div>;

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-3xl px-4 flex flex-col gap-6">
        <Link href="/announcements" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to News
        </Link>
        
        <div className="glass-card p-8 rounded-2xl border-white/10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 text-xs font-bold bg-primary/20 text-primary rounded uppercase">
                  {announcement.type}
                </span>
                {announcement.isPinned && (
                  <span className="px-2 py-1 text-xs font-bold bg-yellow-500/20 text-yellow-500 rounded uppercase">
                    PINNED
                  </span>
                )}
                <span className="text-sm text-muted-foreground">
                  {format(new Date(announcement.createdAt), 'MMMM d, yyyy')}
                </span>
              </div>
              <h1 className="text-3xl font-black text-white">{announcement.title}</h1>
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none text-muted-foreground">
            {announcement.content.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10 text-sm text-muted-foreground">
            Posted by <span className="text-white font-medium">{announcement.authorName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
