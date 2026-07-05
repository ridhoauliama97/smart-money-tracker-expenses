import type { Category } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-food", name: "Makanan", icon: "UtensilsCrossed", color: "#f97316", type: "expense" },
  { id: "cat-transport", name: "Transport", icon: "Car", color: "#3b82f6", type: "expense" },
  { id: "cat-shopping", name: "Belanja", icon: "ShoppingBag", color: "#ec4899", type: "expense" },
  { id: "cat-bills", name: "Tagihan", icon: "Receipt", color: "#eab308", type: "expense" },
  { id: "cat-entertainment", name: "Hiburan", icon: "Gamepad2", color: "#a855f7", type: "expense" },
  { id: "cat-health", name: "Kesehatan", icon: "HeartPulse", color: "#ef4444", type: "expense" },
  { id: "cat-education", name: "Pendidikan", icon: "GraduationCap", color: "#06b6d4", type: "expense" },
  { id: "cat-other-exp", name: "Lainnya", icon: "MoreHorizontal", color: "#64748b", type: "expense" },
  { id: "cat-salary", name: "Gaji", icon: "Wallet", color: "#10b981", type: "income" },
  { id: "cat-bonus", name: "Bonus", icon: "Gift", color: "#22d3ee", type: "income" },
  { id: "cat-invest", name: "Investasi", icon: "TrendingUp", color: "#84cc16", type: "income" },
  { id: "cat-other-inc", name: "Lain-lain", icon: "Plus", color: "#14b8a6", type: "income" },
];

export const ICON_CHOICES = [
  "UtensilsCrossed", "Car", "ShoppingBag", "Receipt", "Gamepad2",
  "HeartPulse", "GraduationCap", "Home", "Plane", "Coffee",
  "Fuel", "Dumbbell", "Book", "Music", "Film",
  "Wallet", "Gift", "TrendingUp", "Briefcase", "Landmark",
  "PiggyBank", "CreditCard", "Smartphone", "Wifi", "Zap",
  "Pizza", "Shirt", "Baby", "PawPrint", "Wrench",
];

export const COLOR_CHOICES = [
  "#ef4444", "#f97316", "#eab308", "#84cc16", "#10b981",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7",
  "#ec4899", "#f43f5e", "#64748b", "#22d3ee", "#f59e0b",
];
