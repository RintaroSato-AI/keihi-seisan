import Link from "next/link";
import { Camera, List, FolderKanban, FileText } from "lucide-react";

const menu = [
  {
    href: "/expenses/new",
    icon: Camera,
    title: "経費登録",
    desc: "レシートを撮影・アップロードしてAIで自動読み取り、または手入力で登録",
  },
  {
    href: "/expenses",
    icon: List,
    title: "経費一覧",
    desc: "登録済みの経費を案件・費目・期間で検索",
  },
  {
    href: "/projects",
    icon: FolderKanban,
    title: "案件管理",
    desc: "経費を紐付ける案件・プロジェクトの作成と一覧",
  },
  {
    href: "/reports/new",
    icon: FileText,
    title: "精算書作成",
    desc: "案件単位で経費をまとめてPDF・Excelの精算書を出力",
  },
];

export default function Home() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {menu.map(({ href, icon: Icon, title, desc }) => (
        <Link
          key={href}
          href={href}
          className="rounded-xl border border-black/10 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <Icon className="mb-2 h-6 w-6" />
          <div className="font-semibold">{title}</div>
          <div className="mt-1 text-sm text-black/60">{desc}</div>
        </Link>
      ))}
    </div>
  );
}
