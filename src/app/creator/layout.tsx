"use client";

import { SideNavLayout } from "@/components/layout/SideNavLayout";
import { BookOpen, BarChart3, PlusCircle } from "lucide-react";

const NAV_ITEMS = [
  { href: "/creator", label: "내 작품", icon: BookOpen },
  { href: "/creator/analytics", label: "분석", icon: BarChart3 },
  { href: "/create", label: "새 전자책", icon: PlusCircle },
];

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return <SideNavLayout navItems={NAV_ITEMS}>{children}</SideNavLayout>;
}
