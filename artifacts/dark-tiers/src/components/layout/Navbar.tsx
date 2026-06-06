import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LogOut, User, ShieldAlert, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/";
      }
    });
  };

  const navLinks = [
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/players", label: "Players" },
    { href: "/matches", label: "Matches" },
    { href: "/tests", label: "Tier Testers" },
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
            <span className="text-xl font-black tracking-tighter text-white group-hover:text-primary transition-colors duration-200">
              DARK TIERS
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
          {user ? (
            <div className="hidden md:flex items-center gap-4">
              {(user.role === "admin" || user.role === "owner") && (
                <Link href="/admin" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-md transition-colors">
                  <ShieldAlert className="w-4 h-4" /> <span>Admin</span>
                </Link>
              )}
              <div className="flex items-center gap-2">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full border border-white/10" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <span className="text-sm font-medium text-white">{user.displayName || user.username}</span>
              </div>
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

              <div className="border-t border-white/5 mt-2 pt-2">
                {user ? (
                  <div className="flex flex-col gap-2">
                    {(user.role === "admin" || user.role === "owner") && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="px-3 py-2.5 rounded-md text-sm font-medium text-primary bg-primary/10 flex items-center gap-2 transition-colors hover:bg-primary/20"
                      >
                        <ShieldAlert className="w-4 h-4" /> Admin
                      </Link>
                    )}
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full border border-white/10" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-white">{user.displayName || user.username}</span>
                      </div>
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
