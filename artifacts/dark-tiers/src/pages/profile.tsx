import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Save, ChevronLeft, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const DISCORD_URL = "https://discord.gg/mWHwDR8bg7";
const REGIONS = ["NA", "EU", "AS", "OC", "SA"] as const;

export default function Profile() {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const { data: user } = useGetMe();

  /* Fetch linked player to get current region */
  const { data: playerData } = useQuery({
    queryKey: ["my-player", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/players?limit=200`);
      if (!res.ok) return null;
      const d = (await res.json()) as { players: Array<{ id: number; username: string; region: string; userId: number | null }> };
      return d.players.find(p => p.userId === user.id) ?? null;
    },
    enabled: !!user,
  });

  const [displayName, setDisplayName] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Initialise form once data loads */
  const initialized = displayName !== "" || success;
  if (user && !initialized) {
    setDisplayName(user.displayName || user.username || "");
  }
  if (playerData && !region) {
    setRegion(playerData.region ?? "NA");
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, region }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as any).error ?? "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["getMe"] });
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (e: Error) => {
      setError(e.message);
    },
  });

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">You need to be logged in to view your profile.</p>
          <Link href="/login" className="text-primary hover:underline text-sm">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-xl">

        {/* Back */}
        <button onClick={() => history.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border/60 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-border/40 bg-black/20 flex items-center gap-4">
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-14 h-14 rounded-full border-2 border-primary/40" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
            )}
            <div>
              <h1 className="font-black text-white text-xl">{user.displayName || user.username}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">@{user.username}</p>
              {playerData && (
                <Link href={`/players/${playerData.id}`} className="text-[11px] text-primary hover:underline mt-0.5 flex items-center gap-1">
                  View public profile <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="px-6 py-6 flex flex-col gap-5">

            {/* Minecraft username (read-only) */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Minecraft Username</Label>
              <Input
                value={user.username}
                readOnly
                className="bg-white/4 border-white/10 text-white/50 cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground/50">Your Minecraft username cannot be changed after registration.</p>
            </div>

            {/* Display name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your display name"
                maxLength={32}
                className="bg-white/4 border-white/10 text-white placeholder:text-muted-foreground/40 focus:border-primary/50"
              />
            </div>

            {/* Region */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Region</Label>
              <div className="flex gap-2 flex-wrap">
                {REGIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => setRegion(r)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-all ${
                      region === r
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-white/4 border-white/10 text-muted-foreground hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Email (read-only) */}
            {(user as any).email && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</Label>
                <Input
                  value={(user as any).email}
                  readOnly
                  className="bg-white/4 border-white/10 text-white/50 cursor-not-allowed"
                />
              </div>
            )}

            {/* Error / success */}
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">Profile updated successfully.</p>
            )}

            {/* Save */}
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </motion.div>

        {/* Discord CTA */}
        <div className="mt-4 bg-[#5865F2]/10 border border-[#5865F2]/25 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white">Join our Discord</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Connect with the community and apply for tier testing.</p>
          </div>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.133 18.113a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Join Discord
          </a>
        </div>

      </div>
    </div>
  );
}
