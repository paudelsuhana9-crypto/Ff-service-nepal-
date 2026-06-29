import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { seedDatabase } from "./lib/dbSeeder";
import { UserProfile } from "./types";
import logoImg from "./assets/images/nepal_ff_logo_1782647638107.jpg";
import AuthPage from "./components/AuthPage";
import Sidebar from "./components/Sidebar";
import Storefront from "./components/Storefront";
import OrderHistory from "./components/OrderHistory";
import SupportPage from "./components/SupportPage";
import AdminDashboard from "./components/AdminDashboard";
import { ShieldAlert, Gamepad2, AlertTriangle, ShieldCheck, MessageSquare, Bug, Receipt, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [initialCategory, setInitialCategory] = useState<any>("all");
  const [logoUrl, setLogoUrl] = useState<string>(logoImg);
  const [inactivityNotice, setInactivityNotice] = useState<string | null>(null);
  const [isWhatsappOpen, setIsWhatsappOpen] = useState(false);

  const handleAddBalance = () => {
    setInitialCategory("wallet_topup");
    setCurrentTab("home");
  };

  // Monitor custom brand logo settings
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "payment_settings", "default"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
          } else {
            setLogoUrl(logoImg);
          }
        } else {
          setLogoUrl(logoImg);
        }
      },
      (error) => {
        console.error("Failed to fetch brand logo:", error);
        handleFirestoreError(error, OperationType.GET, "payment_settings/default");
      }
    );
    return () => unsubscribe();
  }, []);

  // Run database seeder once when admin is loaded and active
  useEffect(() => {
    if (userProfile?.role === "admin") {
      seedDatabase();
    }
  }, [userProfile]);

  // Monitor auth status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await refreshUserProfile(user.uid, user.email || "");
      } else {
        setUserProfile(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Inactivity auto-logout timer (30 minutes)
  useEffect(() => {
    if (!userProfile) return;

    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    let timeoutId: any;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogoutWithNotice();
      }, INACTIVITY_TIMEOUT);
    };

    const handleLogoutWithNotice = async () => {
      try {
        await signOut(auth);
        setUserProfile(null);
        setInactivityNotice("You have been automatically logged out due to 30 minutes of inactivity.");
      } catch (err) {
        console.error("Auto sign out failed:", err);
      }
    };

    // Events to monitor for user activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Initialize timer
    resetTimer();

    // Attach event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [userProfile]);

  const refreshUserProfile = async (uid?: string, email?: string) => {
    const targetUid = uid || userProfile?.uid;
    const targetEmail = email || userProfile?.email;
    
    if (!targetUid) return;

    try {
      const userRef = doc(db, "users", targetUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        // Verify role mapping for main developer
        if (targetEmail === "sugam206706@gmail.com" && data.role !== "admin") {
          const updated = { ...data, role: "admin" as const };
          setUserProfile(updated);
        } else {
          setUserProfile(data);
        }
      }
    } catch (err) {
      console.error("Failed to load gamer profile:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const renderActiveTab = () => {
    if (!userProfile) return null;

    switch (currentTab) {
      case "home":
        return (
          <Storefront 
            userProfile={userProfile} 
            refreshUserProfile={() => refreshUserProfile()} 
            initialCategory={initialCategory}
            onResetInitialCategory={() => setInitialCategory("all")}
          />
        );
      case "orders":
        return <OrderHistory userId={userProfile.uid} />;
      case "support":
        return <SupportPage userProfile={userProfile} />;
      case "admin":
        if (userProfile.role !== "admin") {
          return (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-red-400 font-bold flex items-center justify-center gap-2">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              ERROR: Unauthorized System Admin Access Level.
            </div>
          );
        }
        return <AdminDashboard />;
      default:
        return (
          <Storefront 
            userProfile={userProfile} 
            refreshUserProfile={() => refreshUserProfile()} 
            initialCategory={initialCategory}
            onResetInitialCategory={() => setInitialCategory("all")}
          />
        );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4" />
          <Gamepad2 className="w-6 h-6 text-cyan-400 absolute top-3 left-3 animate-pulse" />
        </div>
        <p className="text-slate-400 text-sm font-semibold tracking-wider font-mono">
          LOADING CYBER SYSTEM MATRIX...
        </p>
      </div>
    );
  }

  // Auth gate
  if (!userProfile) {
    return (
      <AuthPage 
        onAuthSuccess={(profile) => {
          setUserProfile(profile);
          setInactivityNotice(null);
        }} 
        initialMessage={inactivityNotice} 
      />
    );
  }

  // Suspension gate
  if (userProfile.status === "suspended") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="p-4 bg-red-950/30 border border-red-500/20 rounded-full text-red-500 mb-4 animate-bounce">
          <AlertTriangle className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-wider">
          GAMER PROFILE SUSPENDED
        </h2>
        <p className="text-slate-400 text-sm max-w-md mt-2 leading-relaxed">
          Your access privileges to the FF SERVICE NEPAL have been restricted by the administrator. 
          If you believe this is a mistake, please reach out directly on our official Discord server.
        </p>
        <div className="mt-6 flex gap-4">
          <button 
            id="suspended-support"
            onClick={() => window.open("https://discord.gg")} 
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow transition-all hover:brightness-110"
          >
            Contact Support Team
          </button>
          <button 
            id="suspended-logout"
            onClick={handleLogout} 
            className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:border-slate-700 transition-all"
          >
            Secure Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row relative text-white antialiased font-sans">
      {/* Sidebar navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        userProfile={userProfile} 
        onLogout={handleLogout} 
        onAddBalance={handleAddBalance}
        logoUrl={logoUrl}
      />

      {/* Main content viewport */}
      <main className="flex-1 min-w-0 p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">
        {/* Dynamic header / status display */}
        <div className="hidden md:flex items-center justify-between border-b border-slate-900 pb-6">
          <div className="flex items-center gap-3.5">
            <img
              src={logoUrl}
              alt="Logo"
              className="w-20 h-20 rounded-2xl object-contain border-2 border-purple-500/50 shadow-xl shadow-purple-950/40 bg-black p-1 hover:rotate-6 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-2xl font-black tracking-wider uppercase">
                {currentTab === "home" ? "FF SERVICE NEPAL" : 
                 currentTab === "orders" ? "BILLING & BOOSTS" :
                 currentTab === "support" ? "SUPPORT CENTER" : "ADMIN MATRIX"}
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5 uppercase tracking-widest">
                SYSTEM LEVEL PRIVILEGES ACTIVE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure SSL:
            </span>
            <span className="text-emerald-400 font-bold uppercase">Online & Encrypted</span>
          </div>
        </div>

        {/* View container */}
        <div id="active-tab-container">
          {renderActiveTab()}
        </div>
      </main>

      {/* Floating WhatsApp Action Button with Pop-up Menu */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
        <AnimatePresence>
          {isWhatsappOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="mb-3 bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-2xl shadow-emerald-950/50 w-64 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-black tracking-wider text-emerald-400 uppercase">WhatsApp Support</span>
                <span className="text-[9px] text-slate-500 font-medium">9867699553</span>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <a
                  href="https://wa.me/9779867699553?text=Hello,%20I%20would%20like%20to%20chat%20with%20an%20agent."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 hover:bg-emerald-500/10 border border-slate-800/80 hover:border-emerald-500/30 text-xs font-bold text-slate-300 hover:text-white transition-all group"
                  onClick={() => setIsWhatsappOpen(false)}
                >
                  <span className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 shrink-0">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </span>
                  <span>Chat with Agent</span>
                </a>

                <a
                  href="https://wa.me/9779867699553?text=Hello,%20I%20would%20like%20to%20report%20a%20bug."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 hover:bg-emerald-500/10 border border-slate-800/80 hover:border-emerald-500/30 text-xs font-bold text-slate-300 hover:text-white transition-all group"
                  onClick={() => setIsWhatsappOpen(false)}
                >
                  <span className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 shrink-0">
                    <Bug className="w-3.5 h-3.5" />
                  </span>
                  <span>Report a Bug</span>
                </a>

                <a
                  href="https://wa.me/9779867699553?text=Hello,%20I%20would%20like%20to%20check%20my%20order%20status."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 hover:bg-emerald-500/10 border border-slate-800/80 hover:border-emerald-500/30 text-xs font-bold text-slate-300 hover:text-white transition-all group"
                  onClick={() => setIsWhatsappOpen(false)}
                >
                  <span className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 shrink-0">
                    <Receipt className="w-3.5 h-3.5" />
                  </span>
                  <span>Check Order Status</span>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsWhatsappOpen(!isWhatsappOpen)}
          id="whatsapp-floating-btn"
          className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold px-5 py-3 rounded-full shadow-lg shadow-emerald-950/40 border border-emerald-400/20 hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer"
        >
          {isWhatsappOpen ? (
            <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
          ) : (
            <svg
              className="w-5 h-5 fill-current transition-transform group-hover:rotate-12"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.489 0 9.952-4.43 9.955-9.874.001-2.636-1.02-5.115-2.875-6.973C16.48 1.901 14.015.88 11.411.88c-5.49 0-9.955 4.43-9.958 9.874-.001 1.967.518 3.89 1.5 5.61l-.984 3.59 3.678-.96zm11.13-4.849c-.27-.135-1.597-.788-1.845-.878-.247-.09-.427-.135-.607.135-.18.27-.697.878-.855 1.058-.158.18-.315.202-.585.067-.27-.135-1.14-.42-2.172-1.34-1.03-.92-1.725-2.055-1.928-2.395-.202-.34-.022-.523.147-.691.153-.15.315-.368.473-.553.158-.185.21-.315.315-.523.105-.21.053-.393-.027-.528-.08-.135-.607-1.463-.83-2.002-.218-.524-.459-.452-.607-.46l-.518-.008c-.18 0-.473.067-.72.337-.247.27-.945.923-.945 2.25 0 1.327.967 2.61 1.102 2.79.135.18 1.902 2.904 4.609 4.07 2.707 1.166 2.707.777 3.247.723.54-.054 1.597-.652 1.822-1.282.225-.63.225-1.17.157-1.282-.067-.113-.247-.18-.517-.315z" />
            </svg>
          )}
          <span className="hidden sm:inline">
            {isWhatsappOpen ? "Close Menu" : "WhatsApp Help"}
          </span>
        </button>
      </div>
    </div>
  );
}
