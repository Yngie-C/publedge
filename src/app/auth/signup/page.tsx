"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithOAuth = useAuthStore((s) => s.signInWithOAuth);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOAuth = async (provider: 'google' | 'kakao') => {
    setError("");
    setIsLoading(true);
    try {
      const result = await signInWithOAuth(provider);
      if (result?.error) setError(result.error);
    } finally {
      setIsLoading(false);
    }
  };

  const validate = (): string => {
    if (!displayName.trim()) return "이름을 입력해주세요.";
    if (!email.trim()) return "이메일을 입력해주세요.";
    if (password.length < 6) return "비밀번호는 6자 이상이어야 합니다.";
    if (password !== confirmPassword) return "비밀번호가 일치하지 않습니다.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await signUp({ email, password, displayName });
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="rounded-2xl border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="font-logo text-2xl">이메일을 확인해주세요</CardTitle>
          <CardDescription>
            가입 확인 이메일을 발송했습니다. 이메일의 링크를 클릭해 계정을
            활성화하세요.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-gray-900 hover:underline"
          >
            로그인 페이지로 이동
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-1/4 -left-20 h-60 w-60 rounded-full bg-brand-100 opacity-40 blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 h-60 w-60 rounded-full bg-brand-200 opacity-30 blur-3xl" />
      <Card className="rounded-2xl border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="font-logo text-2xl">회원가입</CardTitle>
          <CardDescription>새 inspic 계정을 만드세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <Input
              label="이름"
              type="text"
              placeholder="홍길동"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="rounded-full"
            />
            <Input
              label="이메일"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="rounded-full"
            />
            <Input
              label="비밀번호"
              type="password"
              placeholder="6자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="rounded-full"
            />
            <Input
              label="비밀번호 확인"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="rounded-full"
            />
            <Button type="submit" isLoading={isLoading} className="mt-2 w-full rounded-full">
              회원가입
            </Button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400">또는</span></div>
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={() => handleOAuth('google')} disabled={isLoading} className="w-full rounded-full">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google로 계속하기
            </Button>
            <Button variant="outline" onClick={() => handleOAuth('kakao')} disabled={isLoading} className="w-full rounded-full bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] border-[#FEE500]">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.644 5.08 4.148 6.51L5.1 21l4.38-2.88C10.265 18.35 11.12 18.5 12 18.5c5.523 0 10-3.477 10-7.75S17.523 3 12 3z" fill="#191919"/>
              </svg>
              카카오로 계속하기
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-gray-500">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-gray-900 hover:underline"
            >
              로그인
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
