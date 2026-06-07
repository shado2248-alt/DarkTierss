import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Navbar } from "@/components/layout/Navbar";
import { WelcomeBanner } from "@/components/ui/welcome-banner";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Leaderboard from "@/pages/leaderboard";
import Matches from "@/pages/matches";
import Tests from "@/pages/tests";
import Announcements from "@/pages/announcements";
import AnnouncementDetail from "@/pages/announcement-detail";
import Admin from "@/pages/admin";
import Login from "@/pages/login";
import Profile from "@/pages/profile";
import Compare from "@/pages/compare";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans">
      <Navbar />
      <WelcomeBanner />
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }}
            className="flex-1 flex flex-col"
          >
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/leaderboard" component={Leaderboard} />
              <Route path="/matches" component={Matches} />
              <Route path="/tests" component={Tests} />
              <Route path="/announcements" component={Announcements} />
              <Route path="/announcements/:id" component={AnnouncementDetail} />
              <Route path="/admin" component={Admin} />
              <Route path="/login" component={Login} />
              <Route path="/profile" component={Profile} />
              <Route path="/compare" component={Compare} />
              <Route component={NotFound} />
            </Switch>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
