"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

interface Expense {
  id: number;
  date: string;
  storeName: string | null;
  amount: number;
  category: string;
  receiptPath: string | null;
  memo: string | null;
  project: { id: number; name: string };
}

interface Project {
  id: number;
  name: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [category, setCategory] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (projectId) params.set("projectId", projectId);
      if (category) params.set("category", category);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/expenses?${params.toString()}`);
      setExpenses(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, category, from, to]);

  async function handleDelete(id: number) {
    if (!confirm("この経費を削除しますか？")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    load();
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">経費一覧</h1>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="rounded-lg border border-black/15 px-2 py-2 text-sm"
        >
          <option value="">案件（すべて）</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-black/15 px-2 py-2 text-sm"
        >
          <option value="">費目（すべて）</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-black/15 px-2 py-2 text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-black/15 px-2 py-2 text-sm"
        />
      </div>

      <div className="mb-3 text-right text-sm text-black/60">
        {loading ? "読み込み中..." : `${expenses.length}件 / 合計 ¥${total.toLocaleString()}`}
      </div>

      <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
        {expenses.length === 0 && !loading && (
          <li className="px-4 py-6 text-center text-sm text-black/50">
            該当する経費がありません
          </li>
        )}
        {expenses.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm text-black/50">
                <span>{e.date}</span>
                <span className="rounded bg-black/5 px-1.5 py-0.5">{e.category}</span>
                <span className="truncate">{e.project.name}</span>
              </div>
              <div className="mt-0.5 font-medium">
                {e.storeName ?? "（店名なし）"}
              </div>
              {e.memo && <div className="text-sm text-black/50">{e.memo}</div>}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="font-semibold">¥{e.amount.toLocaleString()}</span>
              {e.receiptPath && (
                <a
                  href={e.receiptPath}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 underline"
                >
                  レシート
                </a>
              )}
              <button
                onClick={() => handleDelete(e.id)}
                className="text-xs text-red-600 underline"
              >
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 text-right">
        <Link href="/expenses/new" className="text-sm text-blue-600 underline">
          + 経費を登録する
        </Link>
      </div>
    </div>
  );
}
