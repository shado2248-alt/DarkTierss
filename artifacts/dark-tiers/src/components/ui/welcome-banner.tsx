import { useState, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { X, Sparkles } from "lucide-react";

const STORAGE_KEY = "dt_welcome_dismissed_v1";
const EASE = [0.25, 0.1, 0.25, 1] as const;

function DiscordIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.133 18.113a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

export function WelcomeBanner() {
  const { data: user, isLoading } = useGetMe();
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const d = localStorage.getItem(STORAGE_KEY);
    if (!d) setDismissed(false);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const show = mounted && !isLoading && !user && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="overflow-hidden relative z-40"
        >
          {/* Animated shimmer border */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          <div className="relative bg-gradient-to-r from-violet-950/90 via-purple-950/90 to-violet-950/90 backdrop-blur-sm border-b border-primary/20 overflow-hidden">
            {/* Animated background glow */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute top-0 left-1/4 w-64 h-8 rounded-full bg-primary/20 blur-2xl"
                animate={{ x: [0, 40, 0], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute top-0 right-1/4 w-48 h-8 rounded-full bg-violet-500/20 blur-2xl"
                animate={{ x: [0, -30, 0], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Pulsing icon */}
                <motion.div
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center"
                  animate={{ boxShadow: ["0 0 0px rgba(139,92,246,0.4)", "0 0 16px rgba(139,92,246,0.7)", "0 0 0px rgba(139,92,246,0.4)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>

                <div className="min-w-0 flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-bold text-white whitespace-nowrap">
                    Welcome to DARK TIERS
                  </span>
                  <span className="text-xs text-white/50 hidden sm:inline">—</span>
                  <span className="text-xs text-white/60 hidden sm:inline">
                    Track your ELO, earn your tier, compete in ranked 1v1s.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all duration-200 shadow-[0_0_16px_rgba(139,92,246,0.5)] hover:shadow-[0_0_24px_rgba(139,92,246,0.7)] hover:-translate-y-px whitespace-nowrap"
                >
                  <DiscordIcon />
                  Register Free
                </Link>
                <button
                  onClick={dismiss}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
