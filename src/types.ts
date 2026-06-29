export type UserRole = "customer" | "admin";
export type UserStatus = "active" | "suspended";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  walletBalance: number;
  status: UserStatus;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export type PackageCategory = "guild_glory" | "uid_topup" | "likes_boost" | "level_boost" | "social_boost" | "wallet_topup";

export interface Package {
  id: string;
  name: string;
  price: number;
  category: PackageCategory;
  description: string;
  createdAt: string;
  available?: boolean;
}

export type OrderStatus = "Pending" | "Processing" | "Completed" | "Rejected";

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  packageId: string;
  packageName: string;
  price: number;
  category: string;
  status: OrderStatus;
  transactionId: string;
  screenshotUrl: string;
  timestamp: string;
  details: {
    playerUid?: string;
    diamondPackage?: string;
    likesAmount?: string;
    targetLevel?: string;
    socialPlatform?: string;
    socialTargetUrl?: string;
    socialServiceType?: string;
    notes?: string;
    [key: string]: any;
  };
}

export interface PaymentSetting {
  id: string;
  esewaNumber: string;
  esewaQr: string;
  khaltiNumber: string;
  khaltiQr: string;
  binanceAddress: string;
  binanceQr: string;
  logoUrl?: string;
  notice?: string;
}
