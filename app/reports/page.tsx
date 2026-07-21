"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Report {
  id: number;
  title: string;
  totalAmount: number;
  generatedAt: string;
  project: { name: string };
  _count: { expenses: number };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      setReports(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("この精算書を削除しますか？（紐づく経費は未精算に戻ります）")) return;
    await fetch(`/api/reports/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">精算書一覧</h1>
      <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
        {!loading && reports.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-black/50">
            作成済みの精算書がありません
          </li>
        )}
        {reports.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <Link href={`/reports/${r.id}`} className="min-w-0 flex-1 hover:underline">
              <div className="font-medium">{r.title}</div>
              <div className="text-sm text-black/50">
                {r.project.name} ・ {r.generatedAt.slice(0, 10)} ・ {r._count.expenses}件
              </div>
            </Link>
            <span className="font-semibold">¥{r.totalAmount.toLocaleString()}</span>
            <button
              onClick={() => handleDelete(r.id)}
              className="text-xs text-red-600 underline"
            >
              削除
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 text-right">
        <Link href="/reports/new" className="text-sm text-blue-600 underline">
          + 新しい精算書を作成する
        </Link>
      </div>
    </div>
  );
}
