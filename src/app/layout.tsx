import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { ToastProvider } from "@/components/ui/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Publedge",
    template: "%s | Publedge",
  },
  description:
    "전자책을 만들고, 읽고, 오디오북으로 변환하세요. Publedge와 함께 당신의 이야기를 세상에 공유하세요.",
  keywords: ["전자책", "오디오북", "글쓰기", "출판", "ebook"],
  openGraph: {
    title: "Publedge",
    description: "전자책 제작 및 출판 플랫폼",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
