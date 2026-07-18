import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "経費精算",
  description: "レシート写真から経費精算書を作成するアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <header className="border-b border-black/10 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold">
              経費精算
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/expenses/new">経費登録</Link>
              <Link href="/expenses">経費一覧</Link>
              <Link href="/projects">案件管理</Link>
              <Link href="/reports">精算書一覧</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
