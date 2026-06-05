import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LogOut, User, ShieldAlert } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();

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
    { href: "/tests", label: "Tests" },
    { href: "/announcements", label: "News" },
  ];

  return (
    <nav className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
            DARK TIERS
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === link.href || location.startsWith(link.href + "/") 
                    ? "bg-primary/20 text-primary" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {(user.role === 'admin' || user.role === 'owner') && (
                <Link href="/admin" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-md">
                  <ShieldAlert className="w-4 h-4" /> <span className="hidden sm:inline">Admin</span>
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
                <span className="text-sm font-medium hidden sm:block text-white">{user.displayName || user.username}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login" className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-md text-sm font-semibold transition-all shadow-[0_0_15px_rgba(120,40,200,0.3)] hover:shadow-[0_0_25px_rgba(120,40,200,0.5)]">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
