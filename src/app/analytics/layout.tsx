import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { BarChart2, BookOpen, Home } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "내 서재", icon: Home },
  { href: "/analytics", label: "분석", icon: BarChart2 },
  { href: "/explore", label: "탐색", icon: BookOpen },
];

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-56 flex-shrink-0 border-r border-gray-200 bg-white lg:block">
          <nav className="sticky top-0 p-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              메뉴
            </p>
            <ul className="space-y-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
