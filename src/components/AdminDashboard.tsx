import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  setDoc,
  query,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Order, Package, PackageCategory, PaymentSetting, UserProfile, OrderStatus } from "../types";
import logoImg from "../assets/images/nepal_ff_logo_1782647638107.jpg";
import { 
  ShieldAlert, 
  ShoppingBag, 
  Users, 
  QrCode, 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  Plus, 
  Image as ImageIcon,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Compass,
  Megaphone,
  Bell
} from "lucide-react";

export default function AdminDashboard() {
  const [activeSubTab, setActiveSubTab] = useState<"orders" | "services" | "payments" | "users">("orders");
  
  // Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [paymentSetting, setPaymentSetting] = useState<PaymentSetting | null>(null);

  // Loading & Feedback States
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Search Filters
  const [orderSearch, setOrderSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Package CRUD Form State
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [packageName, setPackageName] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [packageCategory, setPackageCategory] = useState<PackageCategory>("guild_glory");
  const [packageDescription, setPackageDescription] = useState("");
  const [packageAvailable, setPackageAvailable] = useState(true);

  // Payment Settings Form State
  const [esewaNum, setEsewaNum] = useState("");
  const [esewaQrUrl, setEsewaQrUrl] = useState("");
  const [khaltiNum, setKhaltiNum] = useState("");
  const [khaltiQrUrl, setKhaltiQrUrl] = useState("");
  const [binanceAddr, setBinanceAddr] = useState("");
  const [binanceQrUrl, setBinanceQrUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [storeNotice, setStoreNotice] = useState("");

  // User adjustment State
  const [walletAdjustmentUserId, setWalletAdjustmentUserId] = useState<string | null>(null);
  const [walletAmountChange, setWalletAmountChange] = useState("");
  const [showReceiptUrl, setShowReceiptUrl] = useState<string | null>(null);

  // Notification State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );

  const sendSystemNotification = async (title: string, options: NotificationOptions) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        if ("serviceWorker" in navigator) {
          try {
            const reg = await navigator.serviceWorker.ready;
            if (reg && typeof reg.showNotification === "function") {
              await reg.showNotification(title, {
                badge: logoImg,
                vibrate: [200, 100, 200, 100, 200],
                tag: "realtime-order-notification",
                ...options
              } as any);
              return;
            }
          } catch (e) {
            console.warn("Service Worker notification failed, using fallback:", e);
          }
        }
        try {
          new Notification(title, options);
        } catch (e) {
          console.error("Standard Notification API failed:", e);
        }
      }
    }
  };

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      osc1.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
      
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.65);
    } catch (e) {
      console.warn("Audio context blocked or unsupported:", e);
    }
  };

  const triggerTestNotification = async () => {
    playNotificationSound();
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        await sendSystemNotification("Test Notification 🔔", {
          body: "Real-time order notifications are configured correctly!",
          icon: logoImg
        });
      } else {
        requestNotificationPermission();
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        await sendSystemNotification("Notifications Enabled! 🎉", {
          body: "You will now receive instant pop-up alerts on this device when an order arrives.",
          icon: logoImg
        });
      }
    }
  };

  // Real-time listener for orders collection to power instant feed updates and sound/device alerts
  useEffect(() => {
    let isFirstLoad = true;
    const q = query(collection(db, "orders"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      ordData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setOrders(ordData);

      // Notify on new additions only
      if (!isFirstLoad) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const newOrder = change.doc.data() as Order;
            if (newOrder.status === "Pending") {
              // Trigger push / system Web Notification using Service Worker showNotification
              sendSystemNotification("New Order Placed! 🔔", {
                body: `${newOrder.packageName} - Rs. ${newOrder.price.toFixed(2)}`,
                icon: logoImg
              });
              // Sound alert
              playNotificationSound();
              // Alert message
              setActionSuccess(`🔔 REALTIME ALERT: New order received for ${newOrder.packageName} (Rs. ${newOrder.price.toFixed(2)}) from ${newOrder.userEmail}!`);
            }
          }
        });
      }
      isFirstLoad = false;
    }, (error) => {
      console.error("Orders collection snapshot error:", error);
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    fetchAdminData();
  }, [activeSubTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      if (activeSubTab === "orders") {
        // Orders are kept up to date in real-time by onSnapshot! No action needed here.
        setLoading(false);
      } else if (activeSubTab === "services") {
        const pkgSnap = await getDocs(collection(db, "packages"));
        const pkgData = pkgSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Package[];
        pkgData.sort((a, b) => {
          const isMembershipA = a.name.toLowerCase().includes("membership");
          const isMembershipB = b.name.toLowerCase().includes("membership");
          
          if (isMembershipA && !isMembershipB) return 1;
          if (!isMembershipA && isMembershipB) return -1;
          if (isMembershipA && isMembershipB) {
            return a.price - b.price;
          }
          
          return a.price - b.price;
        });
        setPackages(pkgData);
      } else if (activeSubTab === "payments") {
        const payDoc = await getDoc(doc(db, "payment_settings", "default"));
        if (payDoc.exists()) {
          const data = payDoc.data() as PaymentSetting;
          setPaymentSetting(data);
          setEsewaNum(data.esewaNumber || "");
          setEsewaQrUrl(data.esewaQr || "");
          setKhaltiNum(data.khaltiNumber || "");
          setKhaltiQrUrl(data.khaltiQr || "");
          setBinanceAddr(data.binanceAddress || "");
          setBinanceQrUrl(data.binanceQr || "");
          setLogoUrl(data.logoUrl || "");
          setStoreNotice(data.notice || "");
        }
      } else if (activeSubTab === "users") {
        const userSnap = await getDocs(collection(db, "users"));
        const userData = userSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as unknown as UserProfile[];
        setUsers(userData);
      }
    } catch (err: any) {
      console.error("Admin fetch failed:", err);
      setActionError("Failed to fetch admin dashboard records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Order status management
  const updateOrderStatus = async (
    orderId: string, 
    newStatus: OrderStatus, 
    userId: string, 
    price: number,
    category?: string,
    walletCredited?: boolean
  ) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      // 1. Update Order Doc
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });

      // 2. If wallet topup order is approved (Processing or Completed) and hasn't been credited yet, credit it
      if (category === "wallet_topup" && (newStatus === "Processing" || newStatus === "Completed") && !walletCredited) {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const currentBalance = userSnap.data().walletBalance || 0;
          const newBalance = currentBalance + price;
          await updateDoc(userRef, { walletBalance: newBalance });
          await updateDoc(orderRef, { walletCredited: true });
          setActionSuccess(`Order status updated to ${newStatus} and Rs. ${price.toFixed(2)} credited to user's wallet!`);
        } else {
          setActionSuccess(`Order status successfully updated to: ${newStatus}`);
        }
      } else {
        setActionSuccess(`Order status successfully updated to: ${newStatus}`);
      }
      
      fetchAdminData();
    } catch (err: any) {
      console.error(err);
      setActionError("Failed to update order status.");
    }
  };

  // CRUD Packages
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const priceNum = parseFloat(packagePrice);
    if (!packageName.trim() || isNaN(priceNum) || priceNum <= 0) {
      setActionError("Please enter valid package specifications (Package Name and a positive Price are required).");
      return;
    }

    try {
      const packageData = {
        name: packageName.trim(),
        price: priceNum,
        category: packageCategory,
        description: (packageDescription || "").trim(),
        createdAt: new Date().toISOString(),
        available: packageAvailable
      };

      if (isEditingPackage && editingPackageId) {
        await updateDoc(doc(db, "packages", editingPackageId), packageData);
        setActionSuccess("Boosting package updated successfully!");
      } else {
        await addDoc(collection(db, "packages"), packageData);
        setActionSuccess("New boosting package created successfully!");
      }

      // Reset form
      setPackageName("");
      setPackagePrice("");
      setPackageDescription("");
      setPackageAvailable(true);
      setIsEditingPackage(false);
      setEditingPackageId(null);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setActionError("Failed to save boosting package.");
    }
  };

  const startEditPackage = (pkg: Package) => {
    setActionError(null);
    setActionSuccess(null);
    setIsEditingPackage(true);
    setEditingPackageId(pkg.id);
    setPackageName(pkg.name);
    setPackagePrice(pkg.price.toString());
    setPackageCategory(pkg.category);
    setPackageDescription(pkg.description);
    setPackageAvailable(pkg.available !== false);
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!window.confirm("Are you sure you want to delete this package from the store?")) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await deleteDoc(doc(db, "packages", packageId));
      setActionSuccess("Package deleted successfully.");
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setActionError("Failed to delete package.");
    }
  };

  // Payment Settings
  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      const updatedSettings = {
        esewaNumber: (esewaNum || "").trim(),
        esewaQr: (esewaQrUrl || "").trim(),
        khaltiNumber: (khaltiNum || "").trim(),
        khaltiQr: (khaltiQrUrl || "").trim(),
        binanceAddress: (binanceAddr || "").trim(),
        binanceQr: (binanceQrUrl || "").trim(),
        logoUrl: (logoUrl || "").trim(),
        notice: (storeNotice || "").trim()
      };

      await setDoc(doc(db, "payment_settings", "default"), updatedSettings, { merge: true });
      setActionSuccess("Store settings and brand logo updated successfully!");
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setActionError("Failed to update store settings.");
    }
  };

  // Adjust User Wallet
  const handleAdjustWallet = async (userId: string) => {
    setActionError(null);
    setActionSuccess(null);
    const amountNum = parseFloat(walletAmountChange);
    if (isNaN(amountNum)) {
      setActionError("Please enter a valid number for wallet balance adjustment.");
      return;
    }

    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentBalance = userSnap.data().walletBalance || 0;
        const newBalance = Math.max(0, currentBalance + amountNum);
        await updateDoc(userRef, { walletBalance: newBalance });
        setActionSuccess(`Successfully adjusted user wallet by Rs. ${amountNum.toFixed(2)}. New balance: Rs. ${newBalance.toFixed(2)}`);
        setWalletAdjustmentUserId(null);
        setWalletAmountChange("");
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      setActionError("Failed to adjust user wallet.");
    }
  };

  // Toggle user suspension status
  const handleToggleSuspension = async (userId: string, currentStatus: string) => {
    setActionError(null);
    setActionSuccess(null);
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    try {
      await updateDoc(doc(db, "users", userId), { status: newStatus });
      setActionSuccess(`User account status updated to: ${newStatus}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setActionError("Failed to change user status.");
    }
  };

  // Filters search matching
  const filteredOrders = orders.filter(order => 
    order.transactionId.toLowerCase().includes(orderSearch.toLowerCase()) ||
    order.userEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
    order.packageName.toLowerCase().includes(orderSearch.toLowerCase()) ||
    (order.details.playerUid && order.details.playerUid.includes(orderSearch))
  );

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
            SYSTEM ADMIN <span className="text-cyan-400 font-medium">CONTROL DECK</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review manual payment screenshots, administer packages, update gateways, and manage users.
          </p>
        </div>

        {/* Real-time Web Notifications Controller */}
        <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-white uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
              Realtime Push Alerts
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Status: <span className={notificationPermission === "granted" ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>
                {notificationPermission.toUpperCase()}
              </span>
            </span>
          </div>

          <div className="flex gap-1.5">
            {notificationPermission !== "granted" && (
              <button
                id="enable-push-notifications"
                type="button"
                onClick={requestNotificationPermission}
                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg text-[10px] font-extrabold text-emerald-400 transition-all cursor-pointer"
              >
                Enable Push Alerts
              </button>
            )}
            <button
              id="test-chime"
              type="button"
              onClick={triggerTestNotification}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Test Notification & Sound
            </button>
          </div>
        </div>
      </div>

      {/* Phone Push Setup Guide banner */}
      <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
        <h4 className="font-bold text-slate-200 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          How to receive order notifications on your phone (iOS / Android)
        </h4>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
          <li>
            <strong className="text-slate-300">iPhone (iOS Safari):</strong> Mobile Safari requires adding websites to your home screen to enable Web Push. Open this dashboard in Safari, tap the <strong className="text-cyan-400">Share</strong> icon, and choose <strong className="text-cyan-400">Add to Home Screen</strong>. Open the newly added app, click "Enable Push Alerts" and allow notifications.
          </li>
          <li>
            <strong className="text-slate-300">Android (Chrome):</strong> Click the three dots in Chrome, select <strong className="text-cyan-400">Install app</strong> or <strong className="text-cyan-400">Add to Home screen</strong>, launch it from your home screen, and click "Enable Push Alerts" to get instant lock screen notifications with sound and custom vibration patterns.
          </li>
          <li>
            <strong className="text-slate-300">Real-time DB Listener:</strong> Keep the dashboard app active (or in the background when added to your Home Screen) so our Firestore listener instantly catches new orders to trigger your device's audio ringer and native push system.
          </li>
        </ul>
      </div>


      {/* Admin Subtabs navigation */}
      <div className="flex border-b border-slate-800 pb-px gap-2 overflow-x-auto">
        {[
          { id: "orders", label: "Pending Orders Feed", icon: ShieldAlert },
          { id: "services", label: "Store Packages (CRUD)", icon: ShoppingBag },
          { id: "payments", label: "Gateways & Logo Settings", icon: QrCode },
          { id: "users", label: "Registered Users", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isAct = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`admin-subtab-${tab.id}`}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all focus:outline-none ${
                isAct
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Global alert messages */}
      {actionError && (
        <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-lg text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tab Panels */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
          <p className="text-sm text-slate-400">Loading deck matrix...</p>
        </div>
      ) : (
        <>
          {/* ORDERS TAB */}
          {activeSubTab === "orders" && (
            <div className="space-y-4">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 max-w-md">
                <Search className="w-4 h-4 text-slate-500 mr-2" />
                <input
                  id="admin-order-search"
                  type="text"
                  placeholder="Search by Transaction ID, email, UID..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="bg-transparent text-white text-xs placeholder-slate-600 focus:outline-none w-full font-mono"
                />
              </div>

              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                    No matching boosting orders in database.
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      id={`admin-order-item-${order.id}`}
                      className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700/80 transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 font-mono block">ORDER UID / ID</span>
                          <span className="text-white font-extrabold uppercase font-mono">{order.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-bold">{order.userEmail}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            order.status === "Pending" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" :
                            order.status === "Processing" ? "bg-blue-500/10 border border-blue-500/20 text-blue-400" :
                            order.status === "Completed" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" :
                            "bg-red-500/10 border border-red-500/20 text-red-400"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 uppercase tracking-wider block">BOOST PACKAGE</span>
                          <span className="text-white font-extrabold">{order.packageName}</span>
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">{order.category.replace("_", " ")}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 uppercase tracking-wider block">TRANSACTION ID</span>
                          <span className="text-cyan-400 font-black font-mono">{order.transactionId}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 uppercase tracking-wider block">ORDER VALUE</span>
                          <span className="text-emerald-400 font-black font-mono">
                            Rs. {order.price.toFixed(2)}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 uppercase tracking-wider block">SUBMITTED TIME</span>
                          <span className="text-slate-400 font-mono">{new Date(order.timestamp).toLocaleString()}</span>
                        </div>

                        {order.details.playerUid && (
                          <div>
                            <span className="text-purple-400 uppercase tracking-wider font-extrabold block">PLAYER UID</span>
                            <span className="text-slate-200 font-black text-sm">{order.details.playerUid}</span>
                          </div>
                        )}

                        {order.details.targetLevel && (
                          <div>
                            <span className="text-purple-400 uppercase tracking-wider block">DESIRED TARGET LEVEL</span>
                            <span className="text-slate-200 font-semibold">{order.details.targetLevel}</span>
                          </div>
                        )}

                        {order.details.socialPlatform && (
                          <div>
                            <span className="text-cyan-400 uppercase tracking-wider block">SOCIAL BOOST PLAN</span>
                            <span className="text-slate-200 font-semibold">
                              {order.details.socialPlatform} ({order.details.socialServiceType})
                            </span>
                          </div>
                        )}

                        {order.details.socialTargetUrl && (
                          <div className="col-span-1 sm:col-span-2">
                            <span className="text-cyan-400 uppercase tracking-wider block">SOCIAL VIDEO / CHANNEL TARGET</span>
                            <a 
                              href={order.details.socialTargetUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-cyan-400 hover:underline truncate block"
                            >
                              {order.details.socialTargetUrl}
                            </a>
                          </div>
                        )}

                        {order.details.guildId && (
                          <>
                            <div>
                              <span className="text-purple-400 uppercase tracking-wider block font-extrabold">GUILD ID</span>
                              <span className="text-slate-200 font-black text-sm font-mono">{order.details.guildId}</span>
                            </div>
                            {order.details.guildName && (
                              <div>
                                <span className="text-purple-400 uppercase tracking-wider block font-extrabold">GUILD NAME</span>
                                <span className="text-slate-200 font-extrabold text-sm">{order.details.guildName}</span>
                              </div>
                            )}
                            {order.details.guildLeader && (
                              <div>
                                <span className="text-purple-400 uppercase tracking-wider block font-extrabold">GUILD LEADER</span>
                                <span className="text-slate-200 font-medium">{order.details.guildLeader}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-cyan-400 uppercase tracking-wider block font-extrabold">REGION / SERVER</span>
                              <span className="text-slate-200 font-extrabold text-xs bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded inline-block">
                                {order.details.guildServer || "Bangladesh"}
                              </span>
                            </div>
                            {order.details.contactPhone && (
                              <div className="col-span-1 sm:col-span-2">
                                <span className="text-cyan-400 uppercase tracking-wider block font-extrabold">CONTACT PHONE / WHATSAPP</span>
                                <span className="text-slate-200 font-black text-sm select-all">{order.details.contactPhone}</span>
                              </div>
                            )}
                          </>
                        )}

                        {order.details.notes && (
                          <div className="col-span-full">
                            <span className="text-slate-500 uppercase tracking-wider block">CUSTOMER REQUEST NOTES</span>
                            <p className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
                              {order.details.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Admin Decision controls */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
                        {order.screenshotUrl ? (
                          <button
                            id={`admin-view-receipt-${order.id}`}
                            type="button"
                            onClick={() => setShowReceiptUrl(order.screenshotUrl)}
                            className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Inspect Payment Screenshot Receipt
                          </button>
                        ) : (
                          <div className="px-4 py-2 bg-slate-950/40 border border-slate-900 text-slate-500 rounded-xl text-xs font-bold flex items-center gap-1.5">
                            No Screenshot Receipt Provided
                          </div>
                        )}

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {order.status === "Pending" && (
                            <>
                              <button
                                id={`admin-reject-btn-${order.id}`}
                                onClick={() => updateOrderStatus(order.id, "Rejected", order.userId, order.price, order.category, order.walletCredited)}
                                className="px-3.5 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/60 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                              >
                                <X className="w-3.5 h-3.5" />
                                Reject receipt
                              </button>
                              <button
                                id={`admin-process-btn-${order.id}`}
                                onClick={() => updateOrderStatus(order.id, "Processing", order.userId, order.price, order.category, order.walletCredited)}
                                className="px-3.5 py-2 bg-blue-950/20 hover:bg-blue-950/40 border border-blue-900/60 text-blue-400 hover:text-blue-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                              >
                                <Compass className="w-3.5 h-3.5 animate-spin" />
                                Approve & Start Boosting
                              </button>
                            </>
                          )}
                          {order.status === "Processing" && (
                            <button
                              id={`admin-complete-btn-${order.id}`}
                              onClick={() => updateOrderStatus(order.id, "Completed", order.userId, order.price, order.category, order.walletCredited)}
                              className="px-4 py-2 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 hover:text-emerald-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              Mark Order as Completed
                            </button>
                          )}
                          {(order.status === "Completed" || order.status === "Rejected") && (
                            <span className="text-slate-500 font-semibold italic text-xs">
                              Order processing is finalized.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SERVICES CRUD TAB */}
          {activeSubTab === "services" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CRUD FORM */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 h-fit">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-400" />
                  {isEditingPackage ? "Modify Boost Package" : "Add Boosting Package"}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isEditingPackage 
                    ? "Updating parameters of an existing package. Click Update to save." 
                    : "Create a new package. To hide or show existing packages instantly, use the Eye toggles on the cards."}
                </p>

                <form onSubmit={handleSavePackage} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Package Name
                    </label>
                    <input
                      id="pkg-form-name"
                      type="text"
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      placeholder="e.g. +10,000 Free Fire Profile Likes"
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white placeholder-slate-600 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Pricing (RS)
                    </label>
                    <input
                      id="pkg-form-price"
                      type="number"
                      step="0.01"
                      value={packagePrice}
                      onChange={(e) => setPackagePrice(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white placeholder-slate-600 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Category Classification
                    </label>
                    <select
                      id="pkg-form-category"
                      value={packageCategory}
                      onChange={(e) => setPackageCategory(e.target.value as any)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white text-xs focus:outline-none"
                    >
                      <option value="guild_glory">Guild Glory Bot</option>
                      <option value="uid_topup">UID Topup</option>
                      <option value="likes_boost">Likes Boost</option>
                      <option value="level_boost">Level Boost</option>
                      <option value="social_boost">Social Media Boost</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Description & Inclusions
                    </label>
                    <textarea
                      id="pkg-form-desc"
                      rows={3}
                      value={packageDescription}
                      onChange={(e) => setPackageDescription(e.target.value)}
                      placeholder="List details, completion time, and guidelines (optional)..."
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white placeholder-slate-600 text-xs focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Availability Status
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPackageAvailable(true)}
                        className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          packageAvailable
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                            : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400"
                        }`}
                      >
                        ● Active (Show)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPackageAvailable(false)}
                        className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          !packageAvailable
                            ? "bg-red-500/10 border-red-500 text-red-400"
                            : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400"
                        }`}
                      >
                        ● Hidden (Hide)
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isEditingPackage && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingPackage(false);
                          setEditingPackageId(null);
                          setPackageName("");
                          setPackagePrice("");
                          setPackageDescription("");
                          setPackageAvailable(true);
                        }}
                        className="flex-1 py-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      id="save-package-btn"
                      type="submit"
                      className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white rounded-lg text-xs font-bold shadow"
                    >
                      {isEditingPackage ? "Update Package" : "Publish Package"}
                    </button>
                  </div>
                </form>
              </div>

              {/* LIST GRID */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Active Services in Store
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      id={`crud-pkg-${pkg.id}`}
                      className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                              {pkg.category.replace("_", " ")}
                            </span>
                            {pkg.available === false ? (
                              <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[8px] font-bold text-red-400 uppercase tracking-wide">
                                Hidden
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-bold text-emerald-400 uppercase tracking-wide">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-emerald-400 font-extrabold text-xs">
                            Rs. {pkg.price.toFixed(2)}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{pkg.name}</h4>
                        <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                          {pkg.description}
                        </p>
                      </div>

                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-800/60">
                        <button
                          id={`toggle-pkg-avail-${pkg.id}`}
                          type="button"
                          onClick={async () => {
                            setActionError(null);
                            setActionSuccess(null);
                            try {
                              const pkgRef = doc(db, "packages", pkg.id);
                              const newAvailability = pkg.available === false;
                              await updateDoc(pkgRef, { available: newAvailability });
                              setActionSuccess(`Package "${pkg.name}" is now ${newAvailability ? "Active (Shown)" : "Hidden"}`);
                              fetchAdminData();
                            } catch (err) {
                              console.error(err);
                              setActionError("Failed to toggle package status.");
                            }
                          }}
                          className={`p-1.5 bg-slate-950 border border-slate-800 rounded transition-colors cursor-pointer ${
                            pkg.available === false
                              ? "hover:border-emerald-500 text-slate-400 hover:text-emerald-400"
                              : "hover:border-amber-500 text-slate-400 hover:text-amber-500"
                          }`}
                          title={pkg.available === false ? "Show in store" : "Hide from store"}
                        >
                          {pkg.available === false ? (
                            <Eye className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                        <button
                          id={`edit-pkg-btn-${pkg.id}`}
                          type="button"
                          onClick={() => startEditPackage(pkg)}
                          className="p-1.5 bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                          title="Edit package parameters"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-pkg-btn-${pkg.id}`}
                          type="button"
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="p-1.5 bg-slate-950 border border-slate-800 hover:border-red-500 rounded text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete package"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PAYMENT GATEWAYS TAB */}
          {activeSubTab === "payments" && (
            <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-400" />
                Configure Payment Coordinates & QRs
              </h3>

              <form onSubmit={handleSavePaymentSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* eSewa Setup */}
                  <div className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                    <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider">eSewa Nepal Gateway</h4>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">eSewa Phone Number</label>
                      <input
                        id="pay-esewa-num"
                        type="text"
                        value={esewaNum}
                        onChange={(e) => setEsewaNum(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">eSewa QR Image (URL or Uploaded)</label>
                      <input
                        id="pay-esewa-qr"
                        type="text"
                        value={esewaQrUrl}
                        onChange={(e) => setEsewaQrUrl(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg text-white text-xs font-mono mb-2"
                        placeholder="Image URL or Base64 data"
                      />
                      <div className="flex items-center gap-2">
                        <label className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-[10px] text-green-400 font-extrabold cursor-pointer transition-all duration-200">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>UPLOAD QR IMAGE</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEsewaQrUrl(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {esewaQrUrl && esewaQrUrl.startsWith("data:image/") && (
                          <span className="text-[10px] text-green-400 font-semibold bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                            Custom QR Uploaded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Khalti Setup */}
                  <div className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Khalti Wallet Gateway</h4>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Khalti Wallet Number</label>
                      <input
                        id="pay-khalti-num"
                        type="text"
                        value={khaltiNum}
                        onChange={(e) => setKhaltiNum(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Khalti QR Image (URL or Uploaded)</label>
                      <input
                        id="pay-khalti-qr"
                        type="text"
                        value={khaltiQrUrl}
                        onChange={(e) => setKhaltiQrUrl(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg text-white text-xs font-mono mb-2"
                        placeholder="Image URL or Base64 data"
                      />
                      <div className="flex items-center gap-2">
                        <label className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-[10px] text-purple-400 font-extrabold cursor-pointer transition-all duration-200">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>UPLOAD QR IMAGE</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setKhaltiQrUrl(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {khaltiQrUrl && khaltiQrUrl.startsWith("data:image/") && (
                          <span className="text-[10px] text-purple-400 font-semibold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                            Custom QR Uploaded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Binance Pay Setup */}
                  <div className="col-span-full space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                    <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Binance Pay (BEP20 Address)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">BEP20 Wallet Address</label>
                        <input
                          id="pay-binance-addr"
                          type="text"
                          value={binanceAddr}
                          onChange={(e) => setBinanceAddr(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Binance QR Image (URL or Uploaded)</label>
                        <input
                          id="pay-binance-qr"
                          type="text"
                          value={binanceQrUrl}
                          onChange={(e) => setBinanceQrUrl(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg text-white text-xs font-mono mb-2"
                          placeholder="Image URL or Base64 data"
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-[10px] text-yellow-400 font-extrabold cursor-pointer transition-all duration-200">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>UPLOAD QR IMAGE</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setBinanceQrUrl(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {binanceQrUrl && binanceQrUrl.startsWith("data:image/") && (
                            <span className="text-[10px] text-yellow-400 font-semibold bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                              Custom QR Uploaded
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Brand Logo Config */}
                  <div className="col-span-full space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Store Brand Logo</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Custom Logo (URL or Uploaded)</label>
                        <input
                          id="pay-logo-url"
                          type="text"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg text-white text-xs font-mono mb-2"
                          placeholder="Image URL or Base64 data"
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-[10px] text-cyan-400 font-extrabold cursor-pointer transition-all duration-200">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>UPLOAD LOGO IMAGE</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setLogoUrl(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {logoUrl && logoUrl.startsWith("data:image/") && (
                            <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                              Custom Logo Uploaded
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Logo Preview */}
                      <div className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 h-28">
                        <span className="text-[10px] text-slate-500 uppercase mb-2">Live Preview</span>
                        <img
                          src={logoUrl || logoImg}
                          alt="Brand Logo Preview"
                          className="w-14 h-14 rounded-xl object-contain border border-purple-500/40 bg-black p-0.5"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = logoImg;
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Store Notice / Announcement Banner */}
                  <div className="col-span-full space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                      Store Notice / Announcement Banner
                    </h4>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Notice Content (Appears at the very top of Storefront)</label>
                      <textarea
                        id="pay-store-notice"
                        value={storeNotice}
                        onChange={(e) => setStoreNotice(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg text-white text-xs leading-relaxed font-sans"
                        placeholder="e.g. ⚡ Mega Sale! Use coupon code FIRST10 or check our instant UID Topup options. Approved in 15 minutes."
                        rows={3}
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Leave empty or clear the content to hide the notice banner from the storefront.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    id="save-payment-settings-btn"
                    type="submit"
                    className="py-2.5 px-6 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow transition-all"
                  >
                    Commit Payment Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* USER MANAGEMENT TAB */}
          {activeSubTab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 max-w-md">
                <Search className="w-4 h-4 text-slate-500 mr-2" />
                <input
                  id="admin-user-search"
                  type="text"
                  placeholder="Search user email or privilege..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-transparent text-white text-xs placeholder-slate-600 focus:outline-none w-full font-mono"
                />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                      <th className="p-4">Gamer Profile / ID</th>
                      <th className="p-4">Access Level</th>
                      <th className="p-4 text-emerald-400">Wallet Balance</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4 text-right">Actions Matrix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.map((user) => (
                      <tr key={user.uid} id={`user-row-${user.uid}`} className="hover:bg-slate-950/40 transition-colors">
                        <td className="p-4 font-mono">
                          <div className="font-bold text-white text-xs">{user.email}</div>
                          <span className="text-[10px] text-slate-500 uppercase">{user.uid}</span>
                        </td>
                        <td className="p-4 font-bold uppercase">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            user.role === "admin" 
                              ? "bg-red-500/15 text-red-400 border border-red-500/20" 
                              : "bg-cyan-500/10 text-cyan-400"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4 font-black font-mono text-emerald-400 text-sm">
                          Rs. ${(user.walletBalance || 0).toFixed(2)}
                        </td>
                        <td className="p-4 font-bold uppercase">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            user.status === "suspended" 
                              ? "bg-red-500/20 border border-red-500/30 text-red-400" 
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}>
                            {user.status || "active"}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          {/* Adjust Balance control trigger */}
                          {walletAdjustmentUserId === user.uid ? (
                            <div className="inline-flex items-center gap-1">
                              <input
                                id="admin-wallet-input"
                                type="number"
                                step="0.01"
                                value={walletAmountChange}
                                onChange={(e) => setWalletAmountChange(e.target.value)}
                                placeholder="e.g. +10 or -5"
                                className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[11px] font-mono text-white focus:outline-none"
                              />
                              <button
                                id="admin-wallet-submit"
                                onClick={() => handleAdjustWallet(user.uid)}
                                className="p-1.5 bg-emerald-950/20 border border-emerald-900/60 text-emerald-400 hover:text-emerald-300 rounded text-[10px] font-bold uppercase"
                              >
                                Save
                              </button>
                              <button
                                id="admin-wallet-cancel"
                                onClick={() => {
                                  setWalletAdjustmentUserId(null);
                                  setWalletAmountChange("");
                                }}
                                className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`adjust-wallet-btn-${user.uid}`}
                              onClick={() => {
                                setWalletAdjustmentUserId(user.uid);
                                setWalletAmountChange("");
                              }}
                              className="px-2 py-1 bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold rounded text-[10px] transition-all"
                            >
                              Adjust Balance
                            </button>
                          )}

                          {/* Toggle access status suspension */}
                          <button
                            id={`suspend-user-btn-${user.uid}`}
                            onClick={() => handleToggleSuspension(user.uid, user.status || "active")}
                            className={`px-2 py-1 border text-[10px] font-bold rounded transition-all ${
                              user.status === "suspended"
                                ? "bg-emerald-950/20 border-emerald-900/60 text-emerald-400 hover:bg-emerald-950/40"
                                : "bg-red-950/10 border-red-950/60 text-red-400 hover:bg-red-950/20"
                            }`}
                          >
                            {user.status === "suspended" ? "Unsuspend" : "Suspend Access"}
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                          No users found matching search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Lightbox for receipt inspector */}
      {showReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4">
            <button
              id="close-admin-lightbox"
              onClick={() => setShowReceiptUrl(null)}
              className="absolute top-2 right-2 p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-[450px] w-full flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden mt-6">
              <img
                src={showReceiptUrl}
                alt="Uploaded customer billing invoice"
                className="max-h-full max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
