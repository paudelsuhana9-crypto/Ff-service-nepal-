import { collection, getDocs, writeBatch, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Package, Announcement, PaymentSetting } from "../types";

const DEFAULT_ANNOUNCEMENTS: Omit<Announcement, "id">[] = [
  {
    title: "⚡ Elite Gaming Store Launched!",
    content: "Welcome to the ultimate hub for Free Fire UID Topups, Guild Glory bots, and social media boosting. All payment approvals take less than 15 minutes! Explore our services now.",
    createdAt: new Date().toISOString(),
  },
  {
    title: "🤖 Guild Glory Bots V2.0 Active",
    content: "Our automatic Guild Glory Bot services have been updated for the latest Free Fire version. Rent or buy now to maximize your guild score instantly!",
    createdAt: new Date().toISOString(),
  }
];

const DEFAULT_PACKAGES: Omit<Package, "id">[] = [
  // Guild Glory Bot
  {
    name: "4 Guild Glory Bots",
    price: 400,
    category: "guild_glory",
    description: "Rent 4 automatic Guild Glory Bots. 100% safe, anti-detection enabled, BGD/Nepal optimal.",
    createdAt: new Date().toISOString()
  },
  {
    name: "8 Guild Glory Bots",
    price: 800,
    category: "guild_glory",
    description: "Rent 8 automatic Guild Glory Bots. Perfect for pushing guild ranks rapidly with 24/7 hosting.",
    createdAt: new Date().toISOString()
  },
  {
    name: "12 Guild Glory Bots",
    price: 1100,
    category: "guild_glory",
    description: "Rent 12 automatic Guild Glory Bots. Ultimate guild power package. Unbeatable speed and efficiency.",
    createdAt: new Date().toISOString()
  },
  // UID Topup
  {
    name: "115 Diamonds UID Topup",
    price: 100,
    category: "uid_topup",
    description: "Fast in-game delivery. Enter your Player UID in the checkout form.",
    createdAt: new Date().toISOString()
  },
  {
    name: "240 Diamonds UID Topup",
    price: 200,
    category: "uid_topup",
    description: "Fast in-game delivery. Enter your Player UID in the checkout form.",
    createdAt: new Date().toISOString()
  },
  {
    name: "480 Diamonds UID Topup",
    price: 380,
    category: "uid_topup",
    description: "Fast in-game delivery. Enter your Player UID in the checkout form.",
    createdAt: new Date().toISOString()
  },
  {
    name: "610 Diamonds UID Topup",
    price: 480,
    category: "uid_topup",
    description: "Popular value package. Instantly credited to your Free Fire account via UID.",
    createdAt: new Date().toISOString()
  },
  {
    name: "850 Diamonds UID Topup",
    price: 680,
    category: "uid_topup",
    description: "Fast in-game delivery. Enter your Player UID in the checkout form.",
    createdAt: new Date().toISOString()
  },
  {
    name: "1090 Diamonds UID Topup",
    price: 880,
    category: "uid_topup",
    description: "Mega diamond pack. Direct-to-player delivery. Antiban and secure.",
    createdAt: new Date().toISOString()
  },
  {
    name: "1240 Diamonds UID Topup",
    price: 980,
    category: "uid_topup",
    description: "Fast in-game delivery. Enter your Player UID in the checkout form.",
    createdAt: new Date().toISOString()
  },
  {
    name: "1480 Diamonds UID Topup",
    price: 1180,
    category: "uid_topup",
    description: "Fast in-game delivery. Enter your Player UID in the checkout form.",
    createdAt: new Date().toISOString()
  },
  {
    name: "1850 Diamonds UID Topup",
    price: 1460,
    category: "uid_topup",
    description: "Fast in-game delivery. Enter your Player UID in the checkout form.",
    createdAt: new Date().toISOString()
  },
  {
    name: "2530 Diamonds UID Topup",
    price: 1900,
    category: "uid_topup",
    description: "Fast in-game delivery. Enter your Player UID in the checkout form.",
    createdAt: new Date().toISOString()
  },
  {
    name: "5060 Diamonds UID Topup",
    price: 3800,
    category: "uid_topup",
    description: "Fast in-game delivery. Enter your Player UID in the checkout form.",
    createdAt: new Date().toISOString()
  },
  {
    name: "10120 Diamonds UID Topup",
    price: 8000,
    category: "uid_topup",
    description: "Fast in-game delivery. Enter your Player UID in the checkout form.",
    createdAt: new Date().toISOString()
  },
  {
    name: "Weekly Membership UID Topup",
    price: 200,
    category: "uid_topup",
    description: "Get weekly benefits instantly. Enter your Player UID.",
    createdAt: new Date().toISOString()
  },
  {
    name: "Monthly Membership UID Topup",
    price: 1000,
    category: "uid_topup",
    description: "Get monthly benefits instantly. Enter your Player UID.",
    createdAt: new Date().toISOString()
  },
  // Likes Boost
  {
    name: "+1,000 Profile Likes Boost",
    price: 2.49,
    category: "likes_boost",
    description: "Get +1,000 instant likes on your Free Fire in-game profile. Requires Player UID only.",
    createdAt: new Date().toISOString()
  },
  {
    name: "+5,000 Profile Likes Boost",
    price: 9.99,
    category: "likes_boost",
    description: "Ultimate profile booster. Gain +5,000 premium likes. 100% safe and secure.",
    createdAt: new Date().toISOString()
  },
  // Level Boost
  {
    name: "Level 1 to 50 Account Speedrun",
    price: 24.99,
    category: "level_boost",
    description: "Fast-track your new account to Level 50. Super rapid leveling via safe bot matchmaking.",
    createdAt: new Date().toISOString()
  },
  {
    name: "Level 50 to 70 Account Boost",
    price: 44.99,
    category: "level_boost",
    description: "Elite level progression. Safe and secure account level boosting to Level 70.",
    createdAt: new Date().toISOString()
  },
  // Social Boost
  {
    name: "1,000 TikTok Followers Boost",
    price: 3.99,
    category: "social_boost",
    description: "Boost your gaming brand. Gain 1,000 real-looking followers on TikTok.",
    createdAt: new Date().toISOString()
  },
  {
    name: "1,000 Instagram Real Likes Boost",
    price: 1.99,
    category: "social_boost",
    description: "Boost your montage videos. Get 1,000 likes on any Instagram post/reel.",
    createdAt: new Date().toISOString()
  },
  {
    name: "1,000 YouTube High-Retention Views",
    price: 3.49,
    category: "social_boost",
    description: "Rank higher on search. Gain 1,000 high-retention views on any gaming video.",
    createdAt: new Date().toISOString()
  },
  // Wallet Topups (NPR)
  {
    name: "Rs. 100 Wallet Balance",
    price: 100,
    category: "wallet_topup",
    description: "Add Rs. 100 exact balance to your wallet.",
    createdAt: new Date().toISOString()
  },
  {
    name: "Rs. 500 Wallet Balance",
    price: 500,
    category: "wallet_topup",
    description: "Add Rs. 500 exact balance to your wallet.",
    createdAt: new Date().toISOString()
  },
  {
    name: "Rs. 1,000 Wallet Balance",
    price: 1000,
    category: "wallet_topup",
    description: "Add Rs. 1,000 exact balance to your wallet.",
    createdAt: new Date().toISOString()
  },
  {
    name: "Rs. 2,500 Wallet Balance",
    price: 2500,
    category: "wallet_topup",
    description: "Add Rs. 2,500 exact balance to your wallet.",
    createdAt: new Date().toISOString()
  },
  {
    name: "Rs. 5,000 Wallet Balance",
    price: 5000,
    category: "wallet_topup",
    description: "Add Rs. 5,000 exact balance to your wallet.",
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_PAYMENT_SETTING: PaymentSetting = {
  id: "default",
  esewaNumber: "9812345678",
  esewaQr: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=esewa_payment_to_elite_gaming_9812345678",
  khaltiNumber: "9808765432",
  khaltiQr: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=khalti_payment_to_elite_gaming_9808765432",
  binanceAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  binanceQr: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=binance_address_0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
};

export async function seedDatabase() {
  try {
    // 1. Seed Packages if empty
    const packagesRef = collection(db, "packages");
    const packagesSnap = await getDocs(packagesRef);
    if (packagesSnap.empty) {
      console.log("Seeding packages...");
      const batch = writeBatch(db);
      DEFAULT_PACKAGES.forEach((pkg) => {
        const docRef = doc(packagesRef);
        batch.set(docRef, pkg);
      });
      await batch.commit();
      console.log("Packages seeded successfully!");
    } else {
      // Sync Guild Glory packages to ensure they are the new ones (4 Bots, 8 Bots, 12 Bots)
      const gloryDocs = packagesSnap.docs.filter(doc => doc.data().category === "guild_glory");
      const hasOldGlory = gloryDocs.some(doc => {
        const name = doc.data().name || "";
        return name.includes("Rental") || name.includes("Lifetime");
      });
      if (gloryDocs.length === 0 || hasOldGlory) {
        console.log("Updating Guild Glory packages to the new ones...");
        const batch = writeBatch(db);
        // Delete all existing guild_glory packages
        gloryDocs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        // Add new guild_glory packages
        const newGlory = DEFAULT_PACKAGES.filter(pkg => pkg.category === "guild_glory");
        newGlory.forEach((pkg) => {
          const docRef = doc(packagesRef);
          batch.set(docRef, pkg);
        });
        await batch.commit();
        console.log("Guild Glory packages synchronized successfully!");
      }

      // Sync UID Topup packages to the new complete list in RS
      const uidDocs = packagesSnap.docs.filter(doc => doc.data().category === "uid_topup");
      const hasOldUidPrices = uidDocs.some(doc => {
        const price = doc.data().price || 0;
        return price < 15; // old prices were in USD e.g. $0.99, $4.99 etc.
      });
      const hasWeeklyMembership = uidDocs.some(doc => doc.data().name.includes("Weekly Membership"));
      if (uidDocs.length === 0 || hasOldUidPrices || !hasWeeklyMembership) {
        console.log("Updating UID Topup packages to the new pricing list in RS...");
        const batch = writeBatch(db);
        // Delete all existing uid_topup packages
        uidDocs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        // Add new uid_topup packages
        const newUid = DEFAULT_PACKAGES.filter(pkg => pkg.category === "uid_topup");
        newUid.forEach((pkg) => {
          const docRef = doc(packagesRef);
          batch.set(docRef, pkg);
        });
        await batch.commit();
        console.log("UID Topup packages synchronized successfully!");
      }

      // Check if wallet topup packages exist, if not, add them specifically
      const hasWalletTopups = packagesSnap.docs.some(doc => doc.data().category === "wallet_topup");
      if (!hasWalletTopups) {
        console.log("Seeding wallet topup packages specifically...");
        const batch = writeBatch(db);
        const walletTopups = [
          {
            name: "Rs. 100 Wallet Balance",
            price: 100,
            category: "wallet_topup",
            description: "Add Rs. 100 exact balance to your wallet.",
            createdAt: new Date().toISOString()
          },
          {
            name: "Rs. 500 Wallet Balance",
            price: 500,
            category: "wallet_topup",
            description: "Add Rs. 500 exact balance to your wallet.",
            createdAt: new Date().toISOString()
          },
          {
            name: "Rs. 1,000 Wallet Balance",
            price: 1000,
            category: "wallet_topup",
            description: "Add Rs. 1,000 exact balance to your wallet.",
            createdAt: new Date().toISOString()
          },
          {
            name: "Rs. 2,500 Wallet Balance",
            price: 2500,
            category: "wallet_topup",
            description: "Add Rs. 2,500 exact balance to your wallet.",
            createdAt: new Date().toISOString()
          },
          {
            name: "Rs. 5,000 Wallet Balance",
            price: 5000,
            category: "wallet_topup",
            description: "Add Rs. 5,000 exact balance to your wallet.",
            createdAt: new Date().toISOString()
          }
        ];
        walletTopups.forEach((pkg) => {
          const docRef = doc(packagesRef);
          batch.set(docRef, pkg);
        });
        await batch.commit();
        console.log("Wallet topup packages seeded successfully!");
      }
    }

    // 2. Seed Announcements if empty
    const annRef = collection(db, "announcements");
    const annSnap = await getDocs(annRef);
    if (annSnap.empty) {
      console.log("Seeding announcements...");
      const batch = writeBatch(db);
      DEFAULT_ANNOUNCEMENTS.forEach((ann) => {
        const docRef = doc(annRef);
        batch.set(docRef, ann);
      });
      await batch.commit();
      console.log("Announcements seeded successfully!");
    }

    // 3. Seed Payment Settings if empty
    const settingsDocRef = doc(db, "payment_settings", "default");
    const settingsSnap = await getDoc(settingsDocRef);
    if (!settingsSnap.exists()) {
      console.log("Seeding default payment settings...");
      await setDoc(settingsDocRef, DEFAULT_PAYMENT_SETTING);
      console.log("Payment settings seeded successfully!");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
