import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-gray-600">
            <BookOpen className="h-5 w-5 text-brand-600" />
            <span className="font-semibold text-gray-900">Publedge</span>
          </div>

          <nav className="flex gap-6 text-sm text-gray-500">
            <Link href="/about" className="hover:text-gray-900 transition-colors">
              소개
            </Link>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">
              개인정보처리방침
            </Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">
              이용약관
            </Link>
          </nav>

          <p className="text-sm text-gray-400">
            &copy; {year} Publedge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
