import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LogOut, User, ShieldAlert, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DISCORD_URL = "https://discord.gg/mWHwDR8bg7";

function DiscordIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.133 18.113a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => { window.location.href = "/"; }
    });
  };

  const navLinks = [
    { href: "/leaderboard",   label: "Leaderboard" },
    { href: "/compare",       label: "Compare" },
    { href: "/tests",         label: "Tier Testers" },
    { href: "/announcements", label: "News" },
  ];

  const isActive = (href: string) =>
    location === href || location.startsWith(href + "/");

  return (
    <nav className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
            <motion.img
              src="/dark-tiers-logo.png"
              alt="DARK TIERS"
              className="w-10 h-10 object-contain rounded-lg"
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            />
            <span className="text-xl font-black tracking-tighter">
              <span className="text-red-500">DARK</span>
              <span className="text-violet-500"> TIERS</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-white"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive(link.href) && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-primary/20 rounded-md"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* Discord button — always visible on desktop */}
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 bg-[#5865F2]/15 hover:bg-[#5865F2]/30 text-[#7289da] hover:text-white border border-[#5865F2]/30 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200"
          >
            <DiscordIcon size={14} />
            Discord
          </a>

          {user ? (
            <div className="hidden md:flex items-center gap-3">
              {(["owner","admin","moderator","tester"] as string[]).includes(user.role) && (
                <Link href="/admin" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-md transition-colors">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{user.role === "owner" ? "Owner Panel" : user.role === "admin" || user.role === "moderator" ? "Admin Panel" : "Staff Panel"}</span>
                </Link>
              )}
              {/* Clickable avatar → profile page */}
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full border border-white/10" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <span className="text-sm font-medium text-white">{user.displayName || user.username}</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden md:block bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-md text-sm font-semibold transition-all shadow-[0_0_15px_rgba(120,40,200,0.3)] hover:shadow-[0_0_25px_rgba(120,40,200,0.5)]"
            >
              Login
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-white/5 bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-white bg-primary/20 border border-primary/30"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Discord in mobile menu */}
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-bold text-[#7289da] hover:bg-[#5865F2]/10 transition-colors"
              >
                <DiscordIcon size={15} />
                Join Discord
              </a>

              <div className="border-t border-white/5 mt-2 pt-2">
                {user ? (
                  <div className="flex flex-col gap-2">
                    {(["owner","admin","moderator","tester"] as string[]).includes(user.role) && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="px-3 py-2.5 rounded-md text-sm font-medium text-primary bg-primary/10 flex items-center gap-2 transition-colors hover:bg-primary/20"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        {user.role === "owner" ? "Owner Panel" : user.role === "admin" || user.role === "moderator" ? "Admin Panel" : "Staff Panel"}
                      </Link>
                    )}
                    <div className="flex items-center justify-between px-3 py-2">
                      <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full border border-white/10" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-white">{user.displayName || user.username}</span>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-md text-sm font-semibold transition-all"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
