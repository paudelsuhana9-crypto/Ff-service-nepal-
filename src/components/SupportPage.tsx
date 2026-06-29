import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile } from "../types";
import { 
  LifeBuoy, 
  HelpCircle, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Compass,
  Send,
  ExternalLink
} from "lucide-react";

interface SupportPageProps {
  userProfile: UserProfile;
}

export default function SupportPage({ userProfile }: SupportPageProps) {
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({});

  const faqs = [
    {
      q: "How long does a UID Diamond Topup take?",
      a: "90% of UID topups are processed within 5 to 15 minutes of payment screenshot verification. Our admins work 24/7 to ensure fast delivery directly to your Free Fire account."
    },
    {
      q: "Is the Guild Glory Auto-Bot 100% safe from bans?",
      a: "Yes! Our automatic Guild Glory bot uses advanced cloud matchmaking simulations that emulate human gameplay. It has a 100% security rate with anti-detection enabled, so your guild will stay totally safe."
    },
    {
      q: "Where can I locate my Player UID in Free Fire?",
      a: "To find your Player UID: open Free Fire, click on your profile banner in the top-left corner, and you'll see a 9-10 digit number labeled 'UID'. Copy and paste this directly into our checkout form."
    },
    {
      q: "What payment systems do you accept?",
      a: "Currently, we accept manual transfers and scan-payments via eSewa, Khalti, and Binance Pay. Make sure to copy the wallet number or address, pay, and then upload the transaction receipt screenshot during checkout."
    }
  ];

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      setError("Please fill out all fields of the support form.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "support_tickets"), {
        userId: userProfile.uid,
        userEmail: userProfile.email,
        subject: ticketSubject.trim(),
        message: ticketMessage.trim(),
        status: "Open",
        timestamp: new Date().toISOString()
      });

      setSuccess("Your support inquiry ticket has been created! Our support team will reach out via email shortly.");
      setTicketSubject("");
      setTicketMessage("");
    } catch (err) {
      console.error(err);
      setError("Failed to submit support ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="space-y-8 font-sans pb-12">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <LifeBuoy className="w-6 h-6 text-purple-400" />
          HELP & GAMER <span className="text-cyan-400 font-medium">SUPPORT</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Resolve order issues, browse FAQs, or open an immediate admin ticket
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Support Gateway Live status & contacts */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              Service Status
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-300 font-bold">UID Topup Gateway</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
                  ● Operational
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-300 font-bold">Guild Glory Bot</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
                  ● Active
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-300 font-bold">Likes/Level Booster</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
                  ● Online
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-300 font-bold">Payment Approvals</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 border border-amber-500/20 text-amber-400 uppercase">
                  ● Slow (15 mins)
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Gamer Live Chat
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Prefer chatting directly over IM applications? Our customer service handles fast chats!
            </p>
            <div className="space-y-2">
              <a 
                href="https://discord.gg" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all group"
              >
                <span>Elite Esports Discord</span>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
              </a>
              <a 
                href="https://wa.me/9779867699553" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all group"
              >
                <span>WhatsApp Instant Care</span>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
              </a>
            </div>
          </div>
        </div>

        {/* FAQs & Contact Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* FAQ Accordion */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              Frequently Answered Questions
            </h3>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div 
                  key={idx} 
                  id={`faq-${idx}`}
                  className="border border-slate-800/85 rounded-xl overflow-hidden bg-slate-950/40"
                >
                  <button
                    id={`faq-btn-${idx}`}
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-950/80 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="text-purple-400 font-bold text-sm">
                      {faqOpen[idx] ? "−" : "+"}
                    </span>
                  </button>
                  {faqOpen[idx] && (
                    <div className="p-4 pt-0 text-xs text-slate-400 border-t border-slate-800/40 bg-slate-950/20 leading-relaxed font-mono">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Inquiry form */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-pink-400" />
              Open a Support Ticket
            </h3>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Inquiry / Ticket Subject
                </label>
                <input
                  id="ticket-subject"
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g. Diamond Delivery Pending for TXN2049"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg text-white placeholder-slate-600 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Detailed Message
                </label>
                <textarea
                  id="ticket-message"
                  required
                  rows={4}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Describe your issue with the payment transfer, transaction ID, or account topup status..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg text-white placeholder-slate-600 text-xs focus:outline-none resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-lg text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <button
                id="submit-ticket-btn"
                type="submit"
                disabled={loading}
                className="py-2.5 px-5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:brightness-110 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Submit Ticket to Admin
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
