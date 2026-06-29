import React from "react";
import { UserProfile } from "../types";
import logoImg from "../assets/images/nepal_ff_logo_1782647638107.jpg";
import { 
  Home, 
  History, 
  LifeBuoy, 
  ShieldAlert, 
  LogOut, 
  User, 
  Wallet,
  Menu,
  X,
  PlusCircle
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
  onAddBalance: () => void;
  logoUrl?: string;
}

export default function Sidebar({ currentTab, setCurrentTab, userProfile, onLogout, onAddBalance, logoUrl }: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { id: "home", label: "Storefront", icon: Home },
    { id: "orders", label: "Order History", icon: History },
    { id: "support", label: "Support", icon: LifeBuoy },
  ];

  if (userProfile?.role === "admin") {
    menuItems.push({ id: "admin", label: "Admin Panel", icon: ShieldAlert });
  }

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img
            src={logoUrl || logoImg}
            alt="Logo"
            className="w-16 h-16 rounded-xl object-contain border-2 border-purple-500/40 shadow-md shadow-purple-950/30 bg-black p-0.5"
            referrerPolicy="no-referrer"
          />
          <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            FF SERVICE NEPAL
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            id="mobile-add-balance-btn"
            onClick={onAddBalance}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/15 border-2 border-emerald-500/30 rounded-full text-sm font-extrabold text-emerald-400 transition-all active:scale-95 cursor-pointer shadow-sm shadow-emerald-950/40"
          >
            <Wallet className="w-4.5 h-4.5 animate-pulse" />
            <span className="font-mono text-xs sm:text-sm">Rs. {userProfile?.walletBalance.toFixed(2)}</span>
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded ml-1 uppercase tracking-wide shadow">ADD</span>
          </button>
          <button 
            id="mobile-menu-toggle"
            onClick={() => setIsOpen(!isOpen)} 
            className="p-1 text-slate-400 hover:text-white focus:outline-none"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Container (Desktop & Drawer for mobile) */}
      <aside 
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 md:sticky md:z-10 flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 h-screen`}
      >
        {/* Brand Header */}
        <div className="hidden md:flex flex-col items-center p-6 border-b border-slate-800 space-y-4">
          <img
            src={logoUrl || logoImg}
            alt="Logo"
            className="w-28 h-28 rounded-2xl object-contain border-2 border-purple-500/50 shadow-xl shadow-purple-950/40 bg-black p-1 hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
          <div className="text-center">
            <div className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400">
              FF SERVICE NEPAL
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-bold tracking-widest uppercase block mt-1">
              SYSTEM ACCESS ACTIVE
            </span>
          </div>
        </div>

        {/* Mobile Close Button (inside drawer) */}
        <div className="md:hidden flex justify-end p-4 border-b border-slate-800">
          <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Info Capsule */}
        <div className="p-4 mx-4 my-6 bg-slate-950/60 border border-slate-800/80 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-purple-600/30 to-cyan-600/30 border border-purple-500/20 rounded-lg">
              <User className="w-5 h-5 text-purple-400" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold truncate text-slate-200" title={userProfile?.email}>
                {userProfile?.email.split("@")[0]}
              </div>
              <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider mt-0.5 ${
                userProfile?.role === "admin" 
                   ? "bg-red-500/20 border border-red-500/30 text-red-400" 
                  : "bg-cyan-500/15 border border-cyan-500/25 text-cyan-400"
              }`}>
                {userProfile?.role}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-800/60 flex items-center justify-between text-sm text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Wallet className="w-4.5 h-4.5 text-emerald-400 animate-pulse" /> Wallet:
            </span>
            <span className="font-extrabold text-emerald-400 text-base font-mono">
              Rs. {userProfile?.walletBalance.toFixed(2)}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/40">
            <button
              id="sidebar-add-balance-btn"
              onClick={onAddBalance}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-110 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30 cursor-pointer border border-emerald-500/20"
            >
              <PlusCircle className="w-4.5 h-4.5" />
              Add Balance
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 relative group overflow-hidden ${
                  isActive
                    ? "text-white bg-slate-800 border-l-4 border-cyan-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            id="sidebar-logout"
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-950/10 text-sm font-semibold transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            Secure Log Out
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
}
