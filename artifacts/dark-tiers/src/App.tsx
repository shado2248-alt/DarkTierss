import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Layout & Pages
import { Navbar } from "@/components/layout/Navbar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Leaderboard from "@/pages/leaderboard";
import Players from "@/pages/players";
import PlayerProfile from "@/pages/player-profile";
import Matches from "@/pages/matches";
import Tests from "@/pages/tests";
import Announcements from "@/pages/announcements";
import AnnouncementDetail from "@/pages/announcement-detail";
import Admin from "@/pages/admin";
import Login from "@/pages/login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};
const pageTransition = { duration: 0.28, ease: "easeOut" };

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
}

function Router() {
  const [location] = useLocation();
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <Switch key={location}>
            <Route path="/">
              <AnimatedPage><Home /></AnimatedPage>
            </Route>
            <Route path="/leaderboard">
              <AnimatedPage><Leaderboard /></AnimatedPage>
            </Route>
            <Route path="/players">
              <AnimatedPage><Players /></AnimatedPage>
            </Route>
            <Route path="/players/:id">
              {(params) => <AnimatedPage><PlayerProfile /></AnimatedPage>}
            </Route>
            <Route path="/matches">
              <AnimatedPage><Matches /></AnimatedPage>
            </Route>
            <Route path="/tests">
              <AnimatedPage><Tests /></AnimatedPage>
            </Route>
            <Route path="/announcements">
              <AnimatedPage><Announcements /></AnimatedPage>
            </Route>
            <Route path="/announcements/:id">
              {(params) => <AnimatedPage><AnnouncementDetail /></AnimatedPage>}
            </Route>
            <Route path="/admin">
              <AnimatedPage><Admin /></AnimatedPage>
            </Route>
            <Route path="/login">
              <AnimatedPage><Login /></AnimatedPage>
            </Route>
            <Route>
              <AnimatedPage><NotFound /></AnimatedPage>
            </Route>
          </Switch>
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
