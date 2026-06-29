import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";
import { UserProfile, UserRole } from "../types";
import { Shield, Sparkles, LogIn, UserPlus, Gamepad2 } from "lucide-react";

interface AuthPageProps {
  onAuthSuccess: (userProfile: UserProfile) => void;
  initialMessage?: string | null;
}

export default function AuthPage({ onAuthSuccess, initialMessage }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(initialMessage || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialMessage) {
      setError(initialMessage);
    }
  }, [initialMessage]);

  const getOrCreateUserProfile = async (uid: string, userEmail: string, displayName?: string | null) => {
    const userDocRef = doc(db, "users", uid);
    const userSnap = await getDoc(userDocRef);
    
    // Check if the user is the main developer/admin
    const role: UserRole = userEmail === "sugam206706@gmail.com" ? "admin" : "customer";
    
    if (userSnap.exists()) {
      const data = userSnap.data() as UserProfile;
      // Ensure the developer gets the admin role even if they existed as customer before
      if (role === "admin" && data.role !== "admin") {
        await setDoc(userDocRef, { ...data, role: "admin" }, { merge: true });
        data.role = "admin";
      }
      return data;
    } else {
      const newUserProfile: UserProfile = {
        uid,
        email: userEmail,
        role,
        walletBalance: 0.0,
        status: "active",
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, newUserProfile);
      return newUserProfile;
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const profile = await getOrCreateUserProfile(
          userCredential.user.uid,
          userCredential.user.email || email,
          userCredential.user.displayName
        );
        onAuthSuccess(profile);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (username) {
          await updateProfile(userCredential.user, { displayName: username });
        }
        const profile = await getOrCreateUserProfile(
          userCredential.user.uid,
          userCredential.user.email || email,
          username || userCredential.user.displayName
        );
        onAuthSuccess(profile);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Invalid email or password");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email is already registered");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await getOrCreateUserProfile(
        result.user.uid,
        result.user.email || "",
        result.user.displayName
      );
      onAuthSuccess(profile);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-blocked") {
        setError("Sign-in popup blocked by the browser. Please allow popups for this site.");
      } else if (err.code === "auth/closed-by-user") {
        setError("Sign-in process closed by user.");
      } else {
        setError("Google One-Tap sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 font-sans">
      {/* Abstract Animated Cyberpunk Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse duration-[8000ms]" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] bg-cyan-900/20 rounded-full blur-[120px] animate-pulse duration-[12000ms]" />
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-emerald-950/10 rounded-full blur-[80px]" />
      </div>

      {/* Futuristic Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-10 z-0" />

      {/* Card Content container */}
      <motion.div 
        id="auth-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6 py-8 mx-4 border bg-slate-900/85 backdrop-blur-md border-slate-800 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.15)]"
      >
        {/* Neon accent top bar */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500 rounded-t-2xl" />

        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] mb-4 animate-bounce duration-[4000ms]">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            FF SERVICE <span className="text-cyan-400 font-medium">NEPAL</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 text-center font-sans">
            Your Ultimate Cyberpunk Game Portal & Boosting Hub
          </p>
        </div>

        {/* Mode switcher tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/60 rounded-lg border border-slate-800/80 mb-6">
          <button
            id="tab-login"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`py-2 text-sm font-semibold rounded-md transition-all duration-300 flex items-center justify-center gap-2 ${
              isLogin 
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/40" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LogIn className="w-4 h-4" />
            Login
          </button>
          <button
            id="tab-signup"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`py-2 text-sm font-semibold rounded-md transition-all duration-300 flex items-center justify-center gap-2 ${
              !isLogin 
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/40" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Sign Up
          </button>
        </div>

        {/* Main form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username / Gamer Tag
              </label>
              <input
                id="auth-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. NeonSlayer_99"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none transition-colors shadow-inner"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gamer@example.com"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none transition-colors"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none transition-colors"
              />
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-950/50 border border-red-800/60 rounded-lg text-red-300 text-xs text-center"
            >
              {error}
            </motion.div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 font-bold rounded-lg text-white tracking-wide text-sm transition-all duration-300 shadow-md ${
              isLogin 
                ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:brightness-110 active:scale-[0.98] shadow-purple-900/20" 
                : "bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:brightness-110 active:scale-[0.98] shadow-cyan-900/20"
            } flex items-center justify-center gap-2`}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" /> Sign In securely
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Create Gaming Account
              </>
            )}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative px-3 bg-slate-900 text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Or Sign In With
          </span>
        </div>

        {/* Google Quick SignIn */}
        <button
          id="auth-google-btn"
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-950/80 active:bg-slate-950 border border-slate-800 hover:border-slate-700 font-semibold text-slate-200 rounded-lg transition-all text-sm flex items-center justify-center gap-2.5 shadow-sm"
        >
          {/* Flat stylized Google G logo */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.1-.28-.19-.58-.19-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Google One-Tap / Sign-In
        </button>

        <div className="mt-6 flex justify-center text-center text-xs text-slate-500 gap-1 font-sans">
          <Shield className="w-3.5 h-3.5 text-cyan-500/80" />
          <span>AES-256 secure, fully audited database environment</span>
        </div>
      </motion.div>
    </div>
  );
}
