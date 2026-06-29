import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Order, OrderStatus } from "../types";
import { motion } from "motion/react";
import { 
  History, 
  Clock, 
  Compass, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Gamepad2, 
  ShieldAlert,
  Search,
  Eye
} from "lucide-react";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface OrderHistoryProps {
  userId: string;
}

export default function OrderHistory({ userId }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // Sort manually since compound query would require a Firestore index which we want to avoid creating if not needed
      ordersData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: {
          userId: userId,
        },
        operationType: OperationType.GET,
        path: "orders"
      };
      console.error('Firestore Error: ', JSON.stringify(errInfo));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            Pending Proof Check
          </span>
        );
      case "Processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Compass className="w-3.5 h-3.5 animate-spin" />
            Active Boosting
          </span>
        );
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400">
            <XCircle className="w-3.5 h-3.5" />
            Rejected Receipt
          </span>
        );
      default:
        return null;
    }
  };

  const renderProgressBar = (status: OrderStatus) => {
    let currentStepIndex = 0;
    let isRejected = status === "Rejected";

    if (status === "Pending") {
      currentStepIndex = 0;
    } else if (status === "Processing") {
      currentStepIndex = 1;
    } else if (status === "Completed") {
      currentStepIndex = 2;
    }

    const steps = [
      { 
        label: "Pending", 
        description: "Order verification check", 
        icon: Clock,
      },
      { 
        label: "In Progress", 
        description: "Active runner boost", 
        icon: Compass,
      },
      { 
        label: "Completed", 
        description: "Boosting success delivery", 
        icon: CheckCircle,
      }
    ];

    const targetWidth = isRejected 
      ? "100%" 
      : currentStepIndex === 1 
        ? "50%" 
        : currentStepIndex === 2 
          ? "100%" 
          : "0%";

    const getProgressColor = () => {
      if (isRejected) return "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]";
      if (currentStepIndex === 1) return "bg-gradient-to-r from-emerald-500 to-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]";
      if (currentStepIndex === 2) return "bg-gradient-to-r from-emerald-500 via-purple-500 to-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]";
      return "bg-emerald-500/40";
    };

    return (
      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 sm:p-5 my-4 shadow-inner relative overflow-hidden">
        {/* Ambient subtle background glow */}
        <div className="absolute -inset-10 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between z-10">
          {/* Progress Connecting Line */}
          <div className="absolute left-[15%] right-[15%] top-[18px] sm:top-[22px] -translate-y-1/2 h-1 bg-slate-900 rounded-full -z-0">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: targetWidth }}
              transition={{ type: "spring", stiffness: 45, damping: 15 }}
              className={`h-full rounded-full relative ${getProgressColor()}`}
            >
              {/* Dynamic shining laser dot representing active work */}
              {!isRejected && currentStepIndex < 2 && (
                <motion.div 
                  animate={{ 
                    x: ["0%", "100%", "0%"],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white blur-[2px] shadow-[0_0_8px_#fff]"
                />
              )}
            </motion.div>
          </div>

          {/* Steps */}
          {steps.map((step, idx) => {
            const StepIcon = step.icon;
            let isCompleted = idx < currentStepIndex && !isRejected;
            let isActive = idx === currentStepIndex && !isRejected;
            let isUpcoming = idx > currentStepIndex && !isRejected;

            // Colors & States
            let nodeBorderColor = "border-slate-800";
            let nodeBg = "bg-slate-950";
            let iconColor = "text-slate-600";
            let labelColor = "text-slate-500";
            let glowColor = "";

            if (isRejected) {
              nodeBorderColor = "border-red-500";
              nodeBg = "bg-red-950/20";
              iconColor = "text-red-400";
              labelColor = "text-red-400 font-bold";
              glowColor = "shadow-[0_0_15px_rgba(239,68,68,0.25)]";
            } else if (isCompleted) {
              nodeBorderColor = "border-emerald-500";
              nodeBg = "bg-emerald-950/20";
              iconColor = "text-emerald-400";
              labelColor = "text-emerald-400";
              glowColor = "shadow-[0_0_15px_rgba(16,185,129,0.25)]";
            } else if (isActive) {
              if (idx === 0) {
                nodeBorderColor = "border-amber-400";
                nodeBg = "bg-amber-950/30";
                iconColor = "text-amber-400";
                labelColor = "text-amber-400 font-extrabold";
                glowColor = "shadow-[0_0_20px_rgba(245,158,11,0.4)]";
              } else if (idx === 1) {
                nodeBorderColor = "border-purple-400";
                nodeBg = "bg-purple-950/30";
                iconColor = "text-purple-400";
                labelColor = "text-purple-400 font-extrabold";
                glowColor = "shadow-[0_0_20px_rgba(168,85,247,0.4)]";
              } else if (idx === 2) {
                nodeBorderColor = "border-cyan-400";
                nodeBg = "bg-cyan-950/30";
                iconColor = "text-cyan-400";
                labelColor = "text-cyan-400 font-extrabold";
                glowColor = "shadow-[0_0_20px_rgba(6,182,212,0.4)]";
              }
            }

            return (
              <div key={idx} className="flex flex-col items-center text-center w-[30%] z-10">
                {/* Step Node */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={isActive ? { 
                    scale: [1, 1.08, 1], 
                    opacity: 1,
                  } : { 
                    scale: 1, 
                    opacity: 1 
                  }}
                  transition={isActive ? { 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  } : { duration: 0.3 }}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative ${nodeBorderColor} ${nodeBg} ${glowColor}`}
                >
                  {/* Rotating visual elements around active booster nodes */}
                  {isActive && idx === 1 && (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border border-dashed border-purple-400/50"
                    />
                  )}
                  {isActive && idx === 2 && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full bg-cyan-400/20"
                    />
                  )}

                  <motion.div
                    animate={isCompleted ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <StepIcon className={`w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 ${iconColor}`} />
                  </motion.div>
                </motion.div>

                {/* Step Labels */}
                <span className={`text-[10px] sm:text-xs font-bold mt-2.5 tracking-wide uppercase transition-colors duration-300 ${labelColor}`}>
                  {isRejected ? "Rejected" : step.label}
                </span>
                <span className="hidden sm:block text-[9px] text-slate-500 font-medium mt-0.5 max-w-[120px] mx-auto truncate">
                  {isRejected ? "Verify issue details" : step.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const filteredOrders = statusFilter === "all"
    ? orders
    : orders.filter(o => o.status === statusFilter);

  return (
    <div className="space-y-6 font-sans pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-purple-400" />
            MY BOOSTING <span className="text-cyan-400 font-medium">HISTORY</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track real-time updates on your topups and gamer boost status
          </p>
        </div>

        {/* Status filters */}
        <div id="status-filter-buttons" className="flex items-center gap-2 self-start sm:self-center overflow-x-auto pb-1 max-w-full">
          {(["all", "Pending", "Processing", "Completed", "Rejected"] as const).map((filter) => (
            <button
              key={filter}
              id={`filter-btn-${filter}`}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === filter
                  ? "bg-slate-800 border border-slate-700 text-white"
                  : "bg-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {filter === "all" ? "All Orders" : filter}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
          <p className="text-sm text-slate-400">Retreiving your billing history...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl text-center">
          <History className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-slate-400 font-bold">No orders found</p>
          <p className="text-xs text-slate-500 mt-1">
            {statusFilter === "all" 
              ? "You haven't purchased any gaming packages yet!" 
              : `No orders matching status: ${statusFilter}`}
          </p>
        </div>
      ) : (
        <div id="orders-list" className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              id={`order-item-${order.id}`}
              className="p-5 bg-slate-900/60 border border-slate-800 hover:border-slate-800/80 rounded-2xl space-y-4 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 font-mono">
                    ORDER ID: <span className="text-slate-400 uppercase">{order.id.slice(0, 8)}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white flex items-center gap-1.5">
                    <Gamepad2 className="w-4 h-4 text-purple-400" />
                    {order.packageName}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Visual Progress Bar */}
              {renderProgressBar(order.status)}

              {/* Order details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs leading-relaxed">
                <div>
                  <span className="text-slate-500 uppercase tracking-wider block">PURCHASE PRICE</span>
                  <span className="text-emerald-400 font-black text-sm">
                    {order.category === "wallet_topup" ? `Rs. ${order.price.toFixed(2)}` : `$${order.price.toFixed(2)}`}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 uppercase tracking-wider block">PAYMENT TRANSACTION ID</span>
                  <span className="text-slate-300 font-mono font-bold">{order.transactionId}</span>
                </div>

                <div>
                  <span className="text-slate-500 uppercase tracking-wider block">TIMESTAMP</span>
                  <span className="text-slate-300 font-mono">
                    {new Date(order.timestamp).toLocaleString()}
                  </span>
                </div>

                {order.details.playerUid && (
                  <div>
                    <span className="text-purple-400 uppercase tracking-wider font-bold block">TARGET PLAYER UID</span>
                    <span className="text-slate-200 font-black text-sm">{order.details.playerUid}</span>
                  </div>
                )}

                {order.details.targetLevel && (
                  <div>
                    <span className="text-purple-400 uppercase tracking-wider block">TARGET PROGRESSION LEVEL</span>
                    <span className="text-slate-200 font-semibold">{order.details.targetLevel}</span>
                  </div>
                )}

                {order.details.socialPlatform && (
                  <div>
                    <span className="text-cyan-400 uppercase tracking-wider block">SOCIAL PLATFORM & TASK</span>
                    <span className="text-slate-200 font-semibold">
                      {order.details.socialPlatform} ({order.details.socialServiceType})
                    </span>
                  </div>
                )}

                {order.details.socialTargetUrl && (
                  <div className="col-span-1 sm:col-span-2">
                    <span className="text-cyan-400 uppercase tracking-wider block">TARGET ACCOUNT / VIDEO URL</span>
                    <a 
                      href={order.details.socialTargetUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-400 font-medium hover:underline truncate block max-w-full"
                    >
                      {order.details.socialTargetUrl}
                    </a>
                  </div>
                )}

                {order.details.guildId && (
                  <>
                    <div>
                      <span className="text-purple-400 uppercase tracking-wider font-bold block">GUILD ID</span>
                      <span className="text-slate-200 font-black text-sm font-mono">{order.details.guildId}</span>
                    </div>
                    {order.details.guildName && (
                      <div>
                        <span className="text-purple-400 uppercase tracking-wider font-bold block">GUILD NAME</span>
                        <span className="text-slate-200 font-extrabold text-sm">{order.details.guildName}</span>
                      </div>
                    )}
                    {order.details.guildLeader && (
                      <div>
                        <span className="text-purple-400 uppercase tracking-wider font-bold block">GUILD LEADER</span>
                        <span className="text-slate-200 font-semibold">{order.details.guildLeader}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-cyan-400 uppercase tracking-wider font-bold block">REGION / SERVER</span>
                      <span className="text-slate-200 font-extrabold text-xs bg-slate-950/60 border border-slate-800/80 px-2 py-0.5 rounded inline-block">
                        {order.details.guildServer || "Bangladesh"}
                      </span>
                    </div>
                    {order.details.contactPhone && (
                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-cyan-400 uppercase tracking-wider font-bold block">CONTACT WHATSAPP / PHONE</span>
                        <span className="text-slate-200 font-black text-sm">{order.details.contactPhone}</span>
                      </div>
                    )}
                  </>
                )}

                {order.details.notes && (
                  <div className="col-span-full">
                    <span className="text-slate-500 uppercase tracking-wider block">YOUR CUSTOM INSTRUCTIONS</span>
                    <p className="text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 mt-1 font-mono">
                      {order.details.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* View receipt action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-500 uppercase">
                  Admins usually process boosting within 15 minutes.
                </span>
                {order.screenshotUrl ? (
                  <button
                    id={`view-receipt-${order.id}`}
                    onClick={() => setSelectedReceipt(order.screenshotUrl)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Payment Receipt
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-500 italic">No receipt screenshot uploaded</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Screenshot viewer lightbox */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4">
            <button
              id="close-lightbox"
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-2 right-2 p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-full transition-colors z-10"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <div className="h-96 w-full flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden mt-6">
              <img
                src={selectedReceipt}
                alt="Payment Receipt screenshot"
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
