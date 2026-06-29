import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, doc, getDoc, query, orderBy, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Package, PackageCategory, Announcement, PaymentSetting, UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBag, 
  Bot, 
  Gem, 
  ThumbsUp, 
  Award, 
  TrendingUp, 
  Megaphone, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  DollarSign,
  QrCode,
  Check,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  User,
  Wallet,
  Receipt,
  ShieldAlert,
  HelpCircle
} from "lucide-react";

const USD_TO_NPR = 135;

const isNprCategory = (category: string) => {
  return true;
};

const getPackageActionText = (pkg: Package) => {
  const nameLower = pkg.name.toLowerCase();
  if (nameLower.includes("weekly membership")) {
    return "Purchase Weekly Membership";
  }
  if (nameLower.includes("monthly membership")) {
    return "Purchase Monthly Membership";
  }
  
  switch (pkg.category) {
    case "wallet_topup":
      return "Load Wallet Funds";
    case "uid_topup":
      return "Topup Player UID";
    case "guild_glory":
      return "Purchase Glory Bot";
    case "likes_boost":
      return "Boost Player Likes";
    case "level_boost":
      return "Boost Account Level";
    case "social_boost":
      return "Boost Social Media";
    default:
      return "Buy / Checkout Now";
  }
};

const getSubmitActionText = (category: string) => {
  switch (category) {
    case "wallet_topup":
      return "Submit Topup Order";
    case "uid_topup":
      return "Submit UID Topup";
    case "guild_glory":
      return "Order Glory Bot";
    case "likes_boost":
      return "Submit Likes Boost";
    case "level_boost":
      return "Submit Level Boost";
    case "social_boost":
      return "Submit Social Boost";
    default:
      return "Submit Order";
  }
};

const getCheckoutSubtitle = (category: string) => {
  switch (category) {
    case "wallet_topup":
      return "Completing wallet top-up step-by-step";
    case "uid_topup":
      return "Completing player top-up step-by-step";
    default:
      return "Completing boost order step-by-step";
  }
};

const getProgressionTitle = (category: string) => {
  switch (category) {
    case "wallet_topup":
      return "Topup Progression";
    case "uid_topup":
      return "Topup Progression";
    default:
      return "Boost Progression";
  }
};

const getCartInvoiceLabel = (category: string) => {
  switch (category) {
    case "wallet_topup":
      return "TOPUP CART INVOICE";
    case "uid_topup":
      return "TOPUP CART INVOICE";
    default:
      return "BOOST CART INVOICE";
  }
};

const getStep1Subtitle = (category: string) => {
  switch (category) {
    case "wallet_topup":
      return "Provide your identification details for the top-up credit";
    case "uid_topup":
      return "Provide Free Fire Player UID for instant delivery";
    default:
      return "Provide credentials or links for the boost delivery";
  }
};

interface StorefrontProps {
  userProfile: UserProfile;
  refreshUserProfile: () => void;
  initialCategory?: PackageCategory | "all";
  onResetInitialCategory?: () => void;
}

export default function Storefront({ userProfile, refreshUserProfile, initialCategory, onResetInitialCategory }: StorefrontProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [paymentSetting, setPaymentSetting] = useState<PaymentSetting | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<PackageCategory | "all">("all");

  useEffect(() => {
    if (initialCategory && initialCategory !== "all") {
      setSelectedCategory(initialCategory);
      if (onResetInitialCategory) {
        onResetInitialCategory();
      }
    }
  }, [initialCategory, onResetInitialCategory]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  
  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentGateway, setPaymentGateway] = useState<"wallet" | "esewa" | "khalti" | "binance">("esewa");
  const [transactionId, setTransactionId] = useState("");
  const [screenshotBase64, setScreenshotBase64] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  
  // Fields for custom requirements
  const [playerUid, setPlayerUid] = useState("");
  const [targetLevel, setTargetLevel] = useState("");
  const [socialPlatform, setSocialPlatform] = useState("TikTok");
  const [socialTargetUrl, setSocialTargetUrl] = useState("");
  const [socialServiceType, setSocialServiceType] = useState("Followers");
  const [notes, setNotes] = useState("");

  // Guild Glory specifics (ffglory.pro style)
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [guildServer, setGuildServer] = useState("Bangladesh");
  const [guildLeader, setGuildLeader] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [customTopupAmount, setCustomTopupAmount] = useState<string>("500");
  const [customTopupError, setCustomTopupError] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      // Fetch Packages
      const pkgsSnap = await getDocs(collection(db, "packages"));
      const pkgsData = pkgsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Package[];
      setPackages(pkgsData);

      // Fetch Announcements
      const annQuery = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
      const annSnap = await getDocs(annQuery);
      const annData = annSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      setAnnouncements(annData);

      // Fetch Payment Settings
      const paymentDoc = await getDoc(doc(db, "payment_settings", "default"));
      if (paymentDoc.exists()) {
        setPaymentSetting(paymentDoc.data() as PaymentSetting);
      }
    } catch (err) {
      console.error("Error fetching store data:", err);
    }
  };

  const categories = [
    { id: "all", label: "All Services Menu", icon: ShoppingBag, description: "Explore our main category list of boosts." },
    { id: "wallet_topup", label: "TOP-UP WALLET (NPR)", icon: Wallet, description: "Load funds into your account wallet instantly using eSewa or Khalti (NPR)." },
    { id: "guild_glory", label: "BUY GLORY BOT", icon: Bot, description: "Safe, rapid, and automated guild activity point & glory booster." },
    { id: "social_boost", label: "SOCIAL MEDIA BOOST", icon: TrendingUp, description: "Gain genuine viewers, high-retention followers, and likes across platforms." },
    { id: "uid_topup", label: "UID TOPUP", icon: Gem, description: "Top-up diamonds safely and fast directly via game player UID." },
    { id: "level_boost", label: "FF LEVEL BOOST", icon: Award, description: "Professional speedrunners to level up your in-game profile quickly." },
    { id: "likes_boost", label: "FF LIKE BOOST", icon: ThumbsUp, description: "Multiply your visible profile thumbs-up safely and organically." },
    { id: "need_help", label: "NEED HELP", icon: HelpCircle, description: "Direct 24/7 instant WhatsApp support. Tap here to start chatting with us now!" }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "wallet_topup": return <Wallet className="w-5 h-5 text-emerald-400" />;
      case "guild_glory": return <Bot className="w-5 h-5 text-purple-400" />;
      case "uid_topup": return <Gem className="w-5 h-5 text-cyan-400" />;
      case "likes_boost": return <ThumbsUp className="w-5 h-5 text-pink-400" />;
      case "level_boost": return <Award className="w-5 h-5 text-emerald-400" />;
      case "social_boost": return <TrendingUp className="w-5 h-5 text-yellow-400" />;
      case "need_help": return <HelpCircle className="w-5 h-5 text-amber-400" />;
      default: return <ShoppingBag className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image screenshot of your transaction receipt.");
      return;
    }
    
    // Read and convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const openCheckout = (pkg: Package) => {
    setSelectedPackage(pkg);
    setCheckoutModalOpen(true);
    setCurrentStep(1);
    
    // Set default payment gateway
    if (pkg.category === "wallet_topup") {
      setPaymentGateway("esewa");
    } else {
      setPaymentGateway("wallet");
    }

    // Reset specific inputs
    setPlayerUid("");
    setTargetLevel("");
    setSocialPlatform("TikTok");
    setSocialTargetUrl("");
    setSocialServiceType("Followers");
    setNotes("");
    setTransactionId("");
    setScreenshotBase64("");
    // Guild Glory resets
    setGuildId("");
    setGuildName("");
    setGuildServer("Bangladesh");
    setGuildLeader("");
    setContactPhone("");
    setError(null);
    setSuccess(null);
  };
  
  const validateStep = (step: number): boolean => {
    setError(null);
    if (!selectedPackage) return false;

    if (step === 1) {
      if ((selectedPackage.category === "uid_topup" || 
           selectedPackage.category === "likes_boost" || 
           selectedPackage.category === "level_boost") && !playerUid.trim()) {
        setError("Please enter your Free Fire Player UID.");
        return false;
      }
      if (selectedPackage.category === "social_boost" && !socialTargetUrl.trim()) {
        setError("Please enter your Target Account/Video URL.");
        return false;
      }
      if (selectedPackage.category === "guild_glory") {
        if (!guildId.trim()) {
          setError("Please enter the Guild ID.");
          return false;
        }
      }
    }
    return true;
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    } else if (step > currentStep) {
      let valid = true;
      for (let s = currentStep; s < step; s++) {
        if (!validateStep(s)) {
          valid = false;
          break;
        }
      }
      if (valid) {
        setCurrentStep(step);
      }
    }
  };

  const scrollLane = (categoryId: string, direction: "left" | "right") => {
    const el = document.getElementById(`lane-${categoryId}`);
    if (el) {
      const scrollAmt = direction === "left" ? -340 : 340;
      el.scrollBy({ left: scrollAmt, behavior: "smooth" });
    }
  };

  const submitOrder = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedPackage) return;

    // Validate specific fields based on category
    if (selectedPackage.category === "uid_topup" && !playerUid) {
      setError("Please enter your Player UID.");
      return;
    }
    if (selectedPackage.category === "likes_boost" && !playerUid) {
      setError("Please enter your Player UID.");
      return;
    }
    if (selectedPackage.category === "level_boost" && !playerUid) {
      setError("Please enter your Player UID.");
      return;
    }
    if (selectedPackage.category === "social_boost" && !socialTargetUrl) {
      setError("Please enter your Target Account/Video URL.");
      return;
    }
    if (selectedPackage.category === "guild_glory") {
      if (!guildId.trim()) {
        setError("Please enter your Guild ID.");
        return;
      }
    }

    if (paymentGateway !== "wallet" && !transactionId.trim()) {
      setError("Please enter the Payment Transaction ID.");
      return;
    }

    setLoading(true);

    try {
      const orderDetails: Record<string, any> = {};
      if (playerUid) orderDetails.playerUid = playerUid;
      if (targetLevel) orderDetails.targetLevel = targetLevel;
      if (selectedPackage.category === "social_boost") {
        orderDetails.socialPlatform = socialPlatform;
        orderDetails.socialTargetUrl = socialTargetUrl;
        orderDetails.socialServiceType = socialServiceType;
      }
      if (selectedPackage.category === "guild_glory") {
        orderDetails.guildId = guildId;
        orderDetails.guildServer = guildServer;
      }
      if (notes) orderDetails.notes = notes;

      let finalTransactionId = transactionId.trim();
      let finalScreenshotUrl = screenshotBase64;
      let finalStatus = "Pending";

      if (paymentGateway === "wallet") {
        const requiredNpr = isNprCategory(selectedPackage.category) ? selectedPackage.price : selectedPackage.price * USD_TO_NPR;
        if (userProfile.walletBalance < requiredNpr) {
          setError(`Insufficient wallet balance. You need Rs. ${requiredNpr.toFixed(2)}.`);
          setLoading(false);
          return;
        }

        // Deduct balance from Firestore
        const userRef = doc(db, "users", userProfile.uid);
        await updateDoc(userRef, { walletBalance: userProfile.walletBalance - requiredNpr });
        
        finalTransactionId = `WALLET-PAY-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
        finalScreenshotUrl = "";
        finalStatus = "Processing"; // Wallet payments go to Processing instantly!
      }

      const orderData = {
        userId: userProfile.uid,
        userEmail: userProfile.email,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        price: selectedPackage.price,
        category: selectedPackage.category,
        status: finalStatus,
        transactionId: finalTransactionId,
        screenshotUrl: finalScreenshotUrl,
        timestamp: new Date().toISOString(),
        details: orderDetails
      };

      await addDoc(collection(db, "orders"), orderData);
      
      if (paymentGateway === "wallet") {
        const deductedNpr = isNprCategory(selectedPackage.category) ? selectedPackage.price : selectedPackage.price * USD_TO_NPR;
        setSuccess(`Instant payment of Rs. ${deductedNpr.toFixed(2)} successful! Your order is now being processed.`);
      } else {
        setSuccess("Your order has been submitted successfully! Admins are reviewing your proof of payment.");
      }
      
      setTimeout(() => {
        setCheckoutModalOpen(false);
        refreshUserProfile();
      }, 3000);
    } catch (err: any) {
      console.error("Order submit failed:", err);
      setError("Failed to submit order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = [...(selectedCategory === "all"
    ? packages.filter(pkg => pkg.available !== false)
    : packages.filter(pkg => pkg.category === selectedCategory && pkg.available !== false)
  )].sort((a, b) => {
    const isMembershipA = a.name.toLowerCase().includes("membership");
    const isMembershipB = b.name.toLowerCase().includes("membership");
    
    if (isMembershipA && !isMembershipB) return 1;
    if (!isMembershipA && isMembershipB) return -1;
    if (isMembershipA && isMembershipB) {
      return a.price - b.price; // Weekly Membership before Monthly Membership
    }
    
    return a.price - b.price;
  });

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Store Announcement/Notice Banner */}
      {paymentSetting?.notice && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/25 rounded-2xl p-4 flex gap-3.5 items-start shadow-md shadow-amber-950/10"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-[10px] font-black tracking-widest text-amber-400 uppercase">STORE ANNOUNCEMENT</h4>
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-semibold">{paymentSetting.notice}</p>
          </div>
        </motion.div>
      )}

      {/* Categories Buy Option Interface */}
      {selectedCategory === "all" ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Header instructions block */}
          <div className="text-center max-w-2xl mx-auto py-2">
            <h3 className="text-xl font-extrabold text-white tracking-wider uppercase bg-gradient-to-r from-purple-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Select Your Boost Option
            </h3>
          </div>

          {/* Core options list layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {categories
              .filter((c) => c.id !== "all" && c.id !== "wallet_topup")
              .map((cat, idx) => {
                const Icon = cat.icon;
                // Get color style
                let borderHoverClass = "hover:border-purple-500/50";
                let iconColorClass = "text-purple-400";
                if (cat.id === "wallet_topup") {
                  borderHoverClass = "hover:border-emerald-500/50 animate-pulse";
                  iconColorClass = "text-emerald-400";
                } else if (cat.id === "guild_glory") {
                  borderHoverClass = "hover:border-purple-500/50";
                  iconColorClass = "text-purple-400";
                } else if (cat.id === "social_boost") {
                  borderHoverClass = "hover:border-yellow-500/50";
                  iconColorClass = "text-yellow-400";
                } else if (cat.id === "uid_topup") {
                  borderHoverClass = "hover:border-cyan-500/50";
                  iconColorClass = "text-cyan-400";
                } else if (cat.id === "level_boost") {
                  borderHoverClass = "hover:border-emerald-500/50";
                  iconColorClass = "text-emerald-400";
                } else if (cat.id === "likes_boost") {
                  borderHoverClass = "hover:border-pink-500/50";
                  iconColorClass = "text-pink-400";
                } else if (cat.id === "need_help") {
                  borderHoverClass = "hover:border-amber-500/50 hover:bg-amber-500/5 shadow-amber-950/10";
                  iconColorClass = "text-amber-400 animate-pulse";
                }

                return (
                  <motion.div
                    key={cat.id}
                    id={`buy-option-${cat.id}`}
                    whileHover={{ y: -4 }}
                    onClick={() => {
                      if (cat.id === "need_help") {
                        window.open("https://wa.me/9779867699553", "_blank");
                      } else {
                        setSelectedCategory(cat.id as any);
                      }
                    }}
                    className={`relative group cursor-pointer bg-slate-900/40 border border-slate-800 ${borderHoverClass} rounded-3xl p-8 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-md shadow-slate-950/20`}
                  >
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                      {/* Top icon */}
                      <div className={`p-4 bg-slate-950 border border-slate-800/80 rounded-full ${iconColorClass} group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                        <Icon className="w-8 h-8" />
                      </div>

                      {/* Info & Labels */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest">
                          {cat.id === "need_help" ? "SUPPORT CHAT" : `OPTION 0${idx + 1}`}
                        </span>
                        <h4 className="text-2xl sm:text-3xl font-black text-white group-hover:text-cyan-400 transition-colors tracking-wide uppercase leading-snug">
                          {cat.label}
                        </h4>
                      </div>
                    </div>

                    <div className="relative z-10 pt-8">
                      <button
                        type="button"
                        className={`w-full py-3 px-6 bg-slate-950 border text-slate-300 font-extrabold text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                          cat.id === "need_help"
                            ? "group-hover:bg-amber-600 group-hover:border-amber-500 group-hover:text-white border-slate-800/80"
                            : "group-hover:bg-purple-600 group-hover:border-purple-500 group-hover:text-white border-slate-800"
                        }`}
                      >
                        <span>{cat.id === "need_help" ? "Chat on WhatsApp" : "View Pricing & Packages"}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      ) : (
        /* Show Pricing and Lists of Packages for Selected Option */
        <div className="space-y-6 animate-fadeIn">
          {/* Breadcrumbs & Navigation header */}
          <div className="flex items-center bg-slate-950/20 border border-slate-800/60 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="flex items-center gap-2 px-5 py-3 bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-purple-500 rounded-xl text-sm sm:text-base font-extrabold transition-all focus:outline-none cursor-pointer shadow-md shadow-purple-950/20"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Options
              </button>
              <div className="h-4 w-[1px] bg-slate-800" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">VIEWING</span>
                <span className="text-xs font-black text-purple-400 uppercase tracking-wider font-bold">
                  {categories.find((c) => c.id === selectedCategory)?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Category Banner Title */}
          <div className="p-6 bg-gradient-to-r from-purple-950/20 via-slate-900/40 to-cyan-950/20 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl mt-1">
                {getCategoryIcon(selectedCategory)}
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  {categories.find((c) => c.id === selectedCategory)?.label}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {categories.find((c) => c.id === selectedCategory)?.description}
                </p>
              </div>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/80 px-4 py-2.5 rounded-xl flex-shrink-0 text-center md:text-right">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">
                {selectedCategory === "wallet_topup" ? "FUNDS ROUTE" : "AVAILABLE PACKAGES"}
              </span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {selectedCategory === "wallet_topup" ? "ANY AMOUNT" : `${filteredPackages.length} PLANS`}
              </span>
            </div>
          </div>

          {/* Pricing & Packages List Grid / Custom Topup Interface */}
          {selectedCategory === "wallet_topup" ? (
            <div className="max-w-2xl mx-auto pt-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/40 border border-slate-800/80 hover:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                  <Wallet className="w-48 h-48 text-emerald-400 rotate-12" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <Wallet className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider">
                      Custom Wallet Balance Top-Up
                    </h3>
                    <p className="text-xs text-slate-400">
                      Instantly load funds into your account instantly using eSewa or Khalti (NPR).
                    </p>
                  </div>
                </div>

                <div className="space-y-5 pt-5 border-t border-slate-800/60">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Enter Top-Up Amount (NPR)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-extrabold font-mono text-sm">
                        Rs.
                      </div>
                      <input
                        id="custom-topup-input"
                        type="number"
                        min="100"
                        placeholder="Minimum Rs. 100"
                        value={customTopupAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomTopupAmount(val);
                          const num = parseInt(val);
                          if (val === "") {
                            setCustomTopupError("Please enter a valid amount.");
                          } else if (isNaN(num) || num < 100) {
                            setCustomTopupError("Minimum top-up balance is Rs. 100.");
                          } else {
                            setCustomTopupError(null);
                          }
                        }}
                        className={`w-full bg-slate-950 border ${
                          customTopupError ? "border-red-500/60 focus:border-red-500" : "border-slate-800 focus:border-emerald-500/60"
                        } rounded-xl py-3 pl-12 pr-4 text-white text-base font-black font-mono focus:outline-none transition-all shadow-inner`}
                      />
                    </div>
                    {customTopupError ? (
                      <p className="text-xs text-red-400 font-bold mt-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {customTopupError}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-2">
                        Minimum top-up amount: <span className="text-slate-300 font-black">Rs. 100</span>. Minimum balance rules apply.
                      </p>
                    )}
                  </div>

                  {/* Quick preset amount tags */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                      Quick Preset Amounts
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {["100", "500", "1000", "2500"].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setCustomTopupAmount(amt);
                            setCustomTopupError(null);
                          }}
                          className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all duration-200 font-mono cursor-pointer ${
                            customTopupAmount === amt
                              ? "bg-emerald-950/20 border-emerald-500/60 text-emerald-400 shadow-md"
                              : "bg-slate-950/40 border-slate-800/85 text-slate-400 hover:text-white hover:border-slate-700"
                          }`}
                        >
                          Rs. {parseInt(amt).toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary Box */}
                  {!customTopupError && customTopupAmount && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-slate-950 border border-slate-800/60 rounded-xl space-y-2"
                    >
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
                        TOP-UP SUMMARY
                      </span>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Exact balance to credit:</span>
                        <span className="font-extrabold text-emerald-400 font-mono">
                          Rs. {parseFloat(customTopupAmount || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Action trigger button */}
                  <div className="pt-2">
                    <button
                      id="initiate-topup-btn"
                      type="button"
                      disabled={!!customTopupError || !customTopupAmount}
                      onClick={() => {
                        const amountNum = parseInt(customTopupAmount);
                        if (isNaN(amountNum) || amountNum < 100) {
                          setCustomTopupError("Minimum top-up balance is Rs. 100.");
                          return;
                        }
                        const customPkg: Package = {
                          id: `custom_topup_${Date.now()}`,
                          name: `Rs. ${amountNum} Wallet Balance`,
                          price: amountNum,
                          category: "wallet_topup",
                          description: `Add Rs. ${amountNum} exact balance to your wallet.`,
                          createdAt: new Date().toISOString()
                        };
                        openCheckout(customPkg);
                      }}
                      className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Initiate Top-Up / Checkout
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div id="packages-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackages.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  id={`pkg-card-${pkg.id}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden transition-all duration-300 group shadow-md hover:shadow-xl hover:shadow-cyan-950/10 hover:-translate-y-1 p-8 space-y-6"
                >
                  {/* Package Name */}
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-3xl sm:text-4xl font-black text-white group-hover:text-cyan-400 transition-colors duration-300 leading-snug tracking-tight">
                      {pkg.name}
                    </h3>
                  </div>

                  {/* Pricing Display (in the middle, large text size) */}
                  <div className="py-2">
                    <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 font-mono">
                      {isNprCategory(pkg.category) ? `Rs. ${pkg.price.toLocaleString()}` : `$${pkg.price.toFixed(2)}`}
                    </div>
                  </div>

                  {/* CTA Buy Button */}
                  <div className="w-full">
                    <button
                      id={`buy-btn-${pkg.id}`}
                      onClick={() => openCheckout(pkg)}
                      className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:brightness-110 active:scale-[0.98] text-white font-extrabold text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-purple-950/20 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {getPackageActionText(pkg)}
                    </button>
                  </div>
                </motion.div>
              ))}

              {filteredPackages.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
                  <Info className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm">No services available in this category currently.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dynamic Checkout & Payment Modal */}
      <AnimatePresence>
        {checkoutModalOpen && selectedPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8"
            >
              {/* Neon border top */}
              <div className="h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-indigo-500" />
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Secure Store Checkout</h3>
                    <p className="text-xs text-slate-400">{getCheckoutSubtitle(selectedPackage.category)}</p>
                  </div>
                </div>
                <button
                  id="close-checkout"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Multi-step Columns Container */}
              <div className="flex flex-col md:flex-row min-h-[520px]">
                {/* Left Panel: Stepper Sidebar Column */}
                <div className="w-full md:w-64 bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-0.5">
                        SECURE GATEWAY
                      </span>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {getProgressionTitle(selectedPackage.category)}
                      </h4>
                    </div>

                    {/* Stepper Steps clickable labels list */}
                    <div className="flex md:flex-col gap-3 md:gap-5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
                      {[
                        { number: 1, label: "Target Account", sub: "ID & Profile Setup", icon: User },
                        { number: 2, label: "Secure Payment", sub: "Scan QR Transfer", icon: Wallet },
                        { number: 3, label: "Confirm Transfer", sub: "Receipt & Txn Code", icon: Receipt }
                      ].map((s) => {
                        const StepIcon = s.icon;
                        const isCompleted = currentStep > s.number;
                        const isActive = currentStep === s.number;
                        return (
                          <button
                            key={s.number}
                            type="button"
                            onClick={() => goToStep(s.number)}
                            className="flex items-center gap-3 text-left min-w-[145px] md:min-w-0 flex-shrink-0 group focus:outline-none"
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 border text-xs font-bold font-mono ${
                              isCompleted 
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                : isActive
                                ? "bg-purple-500/20 border-purple-400 text-purple-400 shadow-md shadow-purple-500/10"
                                : "bg-slate-900 border-slate-800 text-slate-500 group-hover:border-slate-700 group-hover:text-slate-300"
                            }`}>
                              {isCompleted ? <Check className="w-4 h-4" /> : `0${s.number}`}
                            </div>
                            <div className="hidden sm:block">
                              <span className={`text-xs font-bold block transition-colors duration-300 ${
                                isActive ? "text-purple-400" : isCompleted ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                              }`}>
                                {s.label}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 block">
                                {s.sub}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Desktop Only Package Card Details inside Sidebar */}
                  <div className="hidden md:block pt-5 border-t border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
                      {getCartInvoiceLabel(selectedPackage.category)}
                    </span>
                    <div className="text-xl font-black text-emerald-400 mt-1">
                      Rs. {selectedPackage.price.toFixed(2)}
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 block truncate mt-0.5">
                      {selectedPackage.name}
                    </span>
                  </div>
                </div>

                {/* Right Panel: Step Content Area */}
                <form onSubmit={submitOrder} className="flex-1 p-6 md:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-6">
                    {/* Top Package details banner for responsive views */}
                    <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                          SELECTED PACKAGE
                        </span>
                        <h4 className="text-sm font-extrabold text-white mt-0.5">
                          {selectedPackage.name}
                        </h4>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                          PRICE (RS)
                        </span>
                        <div className="text-lg font-extrabold text-emerald-400">
                          Rs. {selectedPackage.price.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Step 1: Target Account Information */}
                    {currentStep === 1 && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                      >
                        <div className="border-b border-slate-800 pb-2">
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            1. Target Account Information
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">{getStep1Subtitle(selectedPackage.category)}</p>
                        </div>

                        {/* Player UID Field for Free Fire categories */}
                        {(selectedPackage.category === "uid_topup" || 
                          selectedPackage.category === "likes_boost" || 
                          selectedPackage.category === "level_boost") && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                              Free Fire Player UID <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="checkout-player-uid"
                              type="text"
                              required
                              value={playerUid}
                              onChange={(e) => setPlayerUid(e.target.value)}
                              placeholder="e.g. 248910472"
                              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none"
                            />
                            <span className="text-[11px] text-slate-500 mt-1 block">
                              Double-check your Player UID in the game profile before submitting.
                            </span>
                          </div>
                        )}

                        {/* Target Account Level Speedrun */}
                        {selectedPackage.category === "level_boost" && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                              Desired Target Level
                            </label>
                            <input
                              id="checkout-target-level"
                              type="text"
                              value={targetLevel}
                              onChange={(e) => setTargetLevel(e.target.value)}
                              placeholder="e.g. Target Level 60"
                              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none"
                            />
                          </div>
                        )}

                        {/* Social Media Details */}
                        {selectedPackage.category === "social_boost" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                Platform <span className="text-red-500">*</span>
                              </label>
                              <select
                                id="checkout-social-platform"
                                value={socialPlatform}
                                onChange={(e) => setSocialPlatform(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white text-sm focus:outline-none"
                              >
                                <option value="TikTok">TikTok</option>
                                <option value="Facebook">Facebook</option>
                                <option value="Instagram">Instagram</option>
                                <option value="YouTube">YouTube</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                Boost Service Type
                              </label>
                              <select
                                id="checkout-social-service"
                                value={socialServiceType}
                                onChange={(e) => setSocialServiceType(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white text-sm focus:outline-none"
                              >
                                <option value="Followers">Followers</option>
                                <option value="Likes">Likes</option>
                                <option value="Views">Views</option>
                              </select>
                            </div>

                            <div className="col-span-full">
                              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                Target URL (Profile/Video link) <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="checkout-social-url"
                                type="url"
                                required
                                value={socialTargetUrl}
                                onChange={(e) => setSocialTargetUrl(e.target.value)}
                                placeholder="e.g. https://tiktok.com/@myhandle/video/123"
                                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {/* Guild Glory Details (ffglory.pro style) */}
                        {selectedPackage.category === "guild_glory" && (
                          <div className="space-y-4 bg-slate-950/40 border border-slate-800 p-5 rounded-2xl">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                              <Bot className="w-5 h-5 text-purple-400" />
                              <h5 className="text-xs font-black text-white uppercase tracking-wider">
                                Guild Deployment Information
                              </h5>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                  GUILD ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                  id="checkout-guild-id"
                                  type="text"
                                  required
                                  value={guildId}
                                  onChange={(e) => setGuildId(e.target.value)}
                                  placeholder="e.g. 1002934812"
                                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-500 mt-1 block">
                                  The numerical ID of your guild in Free Fire.
                                </span>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                  Server / Region <span className="text-red-500">*</span>
                                </label>
                                <div className="p-2.5 bg-purple-950/20 border border-purple-800/60 rounded-xl flex items-center justify-between">
                                  <span className="text-sm font-black text-white">Bangladesh 🇧🇩</span>
                                  <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-purple-600 text-white rounded">Active Server</span>
                                </div>
                                <span className="text-[10px] text-slate-500 mt-1 block">
                                  Glory deployment is optimized for the Bangladesh region.
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Additional Notes / Instructions (Optional)
                          </label>
                          <textarea
                            id="checkout-notes"
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Special instructions or account details for the game booster..."
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none resize-none"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Choose Payment Gateway & Pay */}
                    {currentStep === 2 && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-5"
                      >
                        <div className="border-b border-slate-800 pb-2">
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            2. Choose Payment Gateway & Pay
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">Select your preferred Nepalese wallet or global crypto gateway</p>
                        </div>

                        {/* Gateway selector tabs */}
                        {(() => {
                          const requiredNpr = isNprCategory(selectedPackage.category) ? selectedPackage.price : selectedPackage.price * USD_TO_NPR;
                          const hasSufficientWallet = (userProfile?.walletBalance || 0) >= requiredNpr;
                          const isTopup = selectedPackage.category === "wallet_topup";
                          
                          const gateways = isTopup
                            ? (["esewa", "khalti", "binance"] as const)
                            : hasSufficientWallet
                            ? (["wallet"] as const)
                            : (["wallet", "esewa", "khalti", "binance"] as const);

                          const gridColsClass = gateways.length === 1 
                            ? "grid-cols-1 max-w-xs mx-auto" 
                            : gateways.length === 3 
                            ? "grid-cols-3" 
                            : "grid-cols-2 sm:grid-cols-4";

                          return (
                            <div className={`grid ${gridColsClass} gap-2`}>
                              {gateways.map((gw) => (
                                <button
                                  key={gw}
                                  id={`payment-tab-${gw}`}
                                  type="button"
                                  onClick={() => setPaymentGateway(gw)}
                                  className={`py-2.5 px-3 rounded-xl border text-[11px] sm:text-xs font-bold uppercase transition-all duration-300 flex flex-col items-center gap-1.5 focus:outline-none ${
                                    paymentGateway === gw
                                      ? "bg-slate-950 border-cyan-400 text-cyan-400 shadow-md shadow-cyan-400/5"
                                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white"
                                  }`}
                                >
                                  {gw === "wallet" ? <Wallet className="w-4 h-4 text-emerald-400" /> : <QrCode className="w-4 h-4" />}
                                  {gw === "wallet" ? "Wallet" : gw === "esewa" ? "eSewa" : gw === "khalti" ? "Khalti" : "Binance Pay"}
                                </button>
                              ))}
                            </div>
                          );
                        })()}

                        {/* Selected Gateway instructions card */}
                        {paymentGateway === "wallet" ? (
                          <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                                <Wallet className="w-5 h-5 animate-pulse" />
                              </div>
                              <div>
                                <h5 className="text-xs font-extrabold text-white uppercase tracking-wider">
                                  Pay Instantly with Wallet Balance
                                </h5>
                                <p className="text-[11px] text-slate-400">
                                  The order value will be deducted from your NPR wallet balance instantly.
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60 text-xs">
                              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                                <span className="text-[10px] text-slate-500 uppercase block tracking-wider mb-0.5">Your Current Wallet Balance</span>
                                <span className="font-bold text-white text-sm font-mono">Rs. {(userProfile.walletBalance || 0).toFixed(2)}</span>
                              </div>
                              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                                <span className="text-[10px] text-slate-500 uppercase block tracking-wider mb-0.5">Required Deduction</span>
                                <span className="font-bold text-emerald-400 text-sm font-mono">Rs. {(isNprCategory(selectedPackage.category) ? selectedPackage.price : selectedPackage.price * USD_TO_NPR).toFixed(2)}</span>
                              </div>
                            </div>

                            {(userProfile.walletBalance || 0) >= (isNprCategory(selectedPackage.category) ? selectedPackage.price : selectedPackage.price * USD_TO_NPR) ? (
                              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[11px] font-bold flex items-center gap-2">
                                <Check className="w-4 h-4 flex-shrink-0" />
                                <span>Sufficient funds available! Click 'Pay & Complete Order' below to process instantly.</span>
                              </div>
                            ) : (
                              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[11px] font-bold space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                  <span>Insufficient wallet balance!</span>
                                </div>
                                <p className="text-[10px] font-normal text-slate-400 leading-relaxed">
                                  You need an additional Rs. {((isNprCategory(selectedPackage.category) ? selectedPackage.price : selectedPackage.price * USD_TO_NPR) - (userProfile.walletBalance || 0)).toFixed(2)} in your wallet to purchase this package.
                                </p>
                                <div className="pt-1.5 border-t border-red-500/10 text-[10px] text-slate-400">
                                  Go to the <span className="text-emerald-400 font-extrabold uppercase">Top-Up Wallet (NPR)</span> category in our services menu to load funds.
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row items-center gap-5">
                            {/* Visual QR presentation */}
                            <div className="flex-shrink-0 w-32 h-32 bg-white p-1.5 rounded-xl flex items-center justify-center shadow-lg">
                              <img
                                src={
                                  paymentGateway === "esewa" 
                                    ? (paymentSetting?.esewaQr || "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=esewa")
                                    : paymentGateway === "khalti" 
                                    ? (paymentSetting?.khaltiQr || "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=khalti")
                                    : (paymentSetting?.binanceQr || "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=binance")
                                }
                                alt={`${paymentGateway} QR Code`}
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                              <h5 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                                Scan QR with your {paymentGateway === "esewa" ? "eSewa" : paymentGateway === "khalti" ? "Khalti" : "Binance"} App
                              </h5>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                {paymentGateway === "binance" ? (
                                  <>
                                    Transfer exactly <span className="text-emerald-400 font-extrabold font-mono">Rs. {selectedPackage.price.toFixed(2)}</span> (or ${(selectedPackage.price / USD_TO_NPR).toFixed(2)} USD via Binance Pay) to complete the order.
                                  </>
                                ) : (
                                  <>
                                    Transfer exactly <span className="text-emerald-400 font-extrabold font-mono">Rs. {selectedPackage.price.toFixed(2)}</span> to complete the order.
                                  </>
                                )}
                              </p>
                              
                              <div className="pt-1.5">
                                <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">
                                  {paymentGateway === "binance" ? "BINANCE BEP20 ADDRESS" : "GATEWAY WALLET PHONE"}
                                </span>
                                <div className="text-xs font-black text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg select-all mt-1 inline-block font-mono max-w-full truncate">
                                  {paymentGateway === "esewa" 
                                    ? paymentSetting?.esewaNumber 
                                    : paymentGateway === "khalti" 
                                    ? paymentSetting?.khaltiNumber 
                                    : paymentSetting?.binanceAddress}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Step 3: Confirm Transfer & Upload Proof */}
                    {currentStep === 3 && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                      >
                        <div className="border-b border-slate-800 pb-2">
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            3. Submit Proof of Transfer
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">Upload a screenshot of the completed wallet or crypto receipt</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                              Transaction ID / Reference ID <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="checkout-transaction-id"
                              type="text"
                              required
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              placeholder="e.g. TXN984124912"
                              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                              Receipt Submission Preview
                            </label>
                            {screenshotBase64 ? (
                              <div className="relative w-full h-11 px-3 bg-emerald-950/20 border border-emerald-800/50 rounded-lg flex items-center justify-between text-xs text-emerald-300">
                                <span className="truncate max-w-[150px]">receipt_submitted.jpg</span>
                                <button
                                  type="button"
                                  onClick={() => setScreenshotBase64("")}
                                  className="p-1 hover:bg-emerald-900/40 rounded text-emerald-400 focus:outline-none"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="h-11 px-3 bg-slate-950 border border-slate-800 text-slate-500 rounded-lg flex items-center justify-center text-xs">
                                No receipt file loaded
                              </div>
                            )}
                          </div>

                          {/* Drag and Drop Zone */}
                          <div className="col-span-full">
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                              Upload Screenshot of Transfer <span className="text-slate-500 font-normal lowercase">(optional)</span>
                            </label>
                            <div
                              id="proof-dragzone"
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-300 ${
                                isDragging
                                  ? "border-cyan-500 bg-cyan-950/10"
                                  : screenshotBase64
                                  ? "border-emerald-800 bg-emerald-950/5"
                                  : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                              }`}
                              onClick={() => document.getElementById("receipt-file")?.click()}
                            >
                              <input
                                id="receipt-file"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleFileChange(e.target.files[0]);
                                  }
                                }}
                              />
                              <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                              <span className="text-xs font-semibold text-slate-300 block">
                                Drag and drop screenshot here, or <span className="text-purple-400 font-bold">browse</span>
                              </span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                Supports PNG, JPG, JPEG (Max 1MB)
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {error && (
                      <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-lg text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {success && (
                      <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>{success}</span>
                      </div>
                    )}
                  </div>

                  {/* Wizard Bottom Actions Footer */}
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-5">
                    {/* Back or Cancel button */}
                    {currentStep === 1 ? (
                      <button
                        id="cancel-order"
                        type="button"
                        onClick={() => setCheckoutModalOpen(false)}
                        className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-semibold rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back
                      </button>
                    )}

                    {/* Next or Submit Button */}
                    {currentStep === 2 && paymentGateway === "wallet" ? (
                      <button
                        id="submit-order-wallet-btn"
                        type="button"
                        disabled={loading || (userProfile.walletBalance || 0) < (isNprCategory(selectedPackage.category) ? selectedPackage.price : selectedPackage.price * USD_TO_NPR)}
                        onClick={() => submitOrder()}
                        className="px-6 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Pay & Complete Order (Instant)
                          </>
                        )}
                      </button>
                    ) : currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep(currentStep)) {
                            setCurrentStep(prev => prev + 1);
                          }
                        }}
                        className="px-5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:brightness-110 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                      >
                        Continue
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        id="submit-order-btn"
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-110 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            {getSubmitActionText(selectedPackage.category)}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
