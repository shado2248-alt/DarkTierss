import { useGetStaff } from "@workspace/api-client-react";
import { TierBadge } from "@/components/ui/tier-badge";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ShieldCheck, User } from "lucide-react";

const ROLE_ORDER: Record<string, number> = { owner: 4, admin: 3, moderator: 2, tester: 1 };

const ROLE_STYLE: Record<string, string> = {
  owner:     "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  admin:     "bg-red-500/15 text-red-400 border-red-500/30",
  moderator: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  tester:    "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner", admin: "Admin", moderator: "Moderator", tester: "Tester",
};

const EASE = [0.25, 0.1, 0.25, 1] as const;

export default function Staff() {
  const { data, isLoading } = useGetStaff();
  const staff = (data as any[]) ?? [];

  // Group by role
  const groups: Record<string, any[]> = {};
  for (const m of staff) {
    if (!groups[m.role]) groups[m.role] = [];
    groups[m.role].push(m);
  }
  const orderedRoles = Object.keys(groups).sort((a, b) => (ROLE_ORDER[b] ?? 0) - (ROLE_ORDER[a] ?? 0));

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-primary mb-2">Community</div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Staff Roster</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg">
            Our certified testers and administrators keep the ranking system fair and accurate. All matches are judged by trained staff.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl border border-white/10 h-52 animate-pulse bg-white/3" />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div className="glass-card rounded-2xl border border-white/10 p-16 text-center text-muted-foreground">
            No staff members found.
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {orderedRoles.map((role, gi) => (
              <motion.div key={role} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: gi * 0.08, ease: EASE }}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${ROLE_STYLE[role] ?? "text-muted-foreground bg-white/5 border-white/10"}`}>
                    {ROLE_LABEL[role] ?? role}
                  </h2>
                  <span className="text-xs text-muted-foreground/50">{groups[role].length} member{groups[role].length !== 1 ? "s" : ""}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {groups[role].map((member, i) => (
                    <motion.div key={member.id}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: gi * 0.08 + i * 0.05, ease: EASE }}
                      className="glass-card rounded-2xl border border-white/10 hover:border-primary/30 transition-colors overflow-hidden flex flex-col">

                      {/* Top band */}
                      <div className="h-1.5 w-full" style={{ background: `linear-gradient(to right, ${member.bestTierColor ?? "#8b5cf6"}, transparent)` }} />

                      <div className="p-5 flex flex-col gap-4 flex-1">
                        {/* Avatar + name */}
                        <div className="flex items-center gap-3">
                          {/* Discord avatar or minecraft skin */}
                          <div className="relative flex-shrink-0">
                            {member.playerUuid ? (
                              <img
                                src={`https://mc-heads.net/avatar/${member.playerUuid}/40`}
                                alt={member.playerUsername ?? member.username}
                                className="w-12 h-12 rounded-xl border border-white/10 object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            ) : member.avatar ? (
                              <img src={member.avatar} alt={member.username} className="w-12 h-12 rounded-xl border border-white/10 object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            {member.isVerified && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center" title="Verified">
                                <ShieldCheck className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="font-black text-white text-sm truncate">
                              {member.displayName || member.username}
                            </div>
                            {member.playerUsername && member.playerUsername !== (member.displayName || member.username) && (
                              <div className="text-[11px] text-muted-foreground truncate font-mono">{member.playerUsername}</div>
                            )}
                            <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1 ${ROLE_STYLE[member.role] ?? ""}`}>
                              {ROLE_LABEL[member.role] ?? member.role}
                            </span>
                          </div>
                        </div>

                        {/* Tier + rating */}
                        {(member.bestTierName || member.bestRating) && (
                          <div className="flex items-center gap-2">
                            {member.bestTierName && <TierBadge tierName={member.bestTierName} tierColor={member.bestTierColor} />}
                            {member.bestRating && (
                              <span className="text-sm font-black text-primary font-mono">{member.bestRating}</span>
                            )}
                          </div>
                        )}

                        {/* Gamemodes */}
                        {member.gamemodes?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-auto">
                            {member.gamemodes.map((gm: string) => (
                              <span key={gm} className="text-[10px] font-bold text-muted-foreground/70 bg-white/5 border border-white/8 rounded px-1.5 py-0.5">
                                {gm}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Profile link */}
                        {member.playerId && (
                          <Link href={`/players/${member.playerId}`} className="text-[11px] text-primary/60 hover:text-primary transition-colors mt-auto">
                            View profile
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
