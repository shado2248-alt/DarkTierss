import { useState } from "react";
import { useLocation } from "wouter";
import { ShieldAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

type Tab = "login" | "register";

async function apiPost(path: string, body: object) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data;
}

export default function Login() {
  const [tab, setTab] = useState<Tab>("login");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regUsername, setRegUsername] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await apiPost("/api/auth/login", { email: loginEmail, password: loginPassword });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (regPassword !== regConfirm) {
      setError("Passwords do not match");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setIsLoading(true);
    try {
      await apiPost("/api/auth/register", {
        email: regEmail,
        password: regPassword,
        minecraftUsername: regUsername,
      });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setSuccess("Account created! Redirecting...");
      setTimeout(() => navigate("/"), 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="glass-card w-full max-w-md rounded-2xl relative z-10 border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 pb-0 text-center">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mb-5 mx-auto shadow-[0_0_30px_rgba(120,40,200,0.3)]">
            <ShieldAlert className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {tab === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 mb-6">
            {tab === "login"
              ? "Sign in to your DARK TIERS account."
              : "Join DARK TIERS and start climbing the ranks."}
          </p>

          {/* Tabs */}
          <div className="flex rounded-lg bg-black/30 border border-white/10 p-1 mb-6">
            {(["login", "register"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all duration-200 relative ${
                  tab === t ? "text-white" : "text-muted-foreground hover:text-white"
                }`}
              >
                {tab === t && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 bg-primary/30 border border-primary/40 rounded-md"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t === "login" ? "Sign In" : "Register"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Forms */}
        <div className="px-8 pb-8">
          <AnimatePresence mode="wait">
            {tab === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleLogin}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="bg-black/40 border-white/10 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="bg-black/40 border-white/10 text-white pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-5 font-bold text-base shadow-[0_0_20px_rgba(120,40,200,0.3)] hover:shadow-[0_0_30px_rgba(120,40,200,0.5)] mt-1"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  No account?{" "}
                  <button type="button" onClick={() => setTab("register")} className="text-primary hover:text-primary/80 font-semibold">
                    Register here
                  </button>
                </p>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleRegister}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Minecraft Username</label>
                  <div className="flex items-center gap-2">
                    {regUsername && (
                      <img
                        src={`https://mc-heads.net/avatar/${encodeURIComponent(regUsername)}/32`}
                        alt="preview"
                        className="w-8 h-8 rounded bg-black border border-white/10 flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <Input
                      type="text"
                      placeholder="YourMCName"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      className="bg-black/40 border-white/10 text-white flex-1"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">This will be your in-game name. Can be changed later.</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="bg-black/40 border-white/10 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="bg-black/40 border-white/10 text-white pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Confirm Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    value={regConfirm}
                    onChange={e => setRegConfirm(e.target.value)}
                    className="bg-black/40 border-white/10 text-white"
                    required
                  />
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </motion.p>
                )}
                {success && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                    {success}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-5 font-bold text-base shadow-[0_0_20px_rgba(120,40,200,0.3)] hover:shadow-[0_0_30px_rgba(120,40,200,0.5)] mt-1"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setTab("login")} className="text-primary hover:text-primary/80 font-semibold">
                    Sign in
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
