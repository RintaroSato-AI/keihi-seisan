"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Project {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  date: string;
  storeName: string | null;
  amount: number;
  category: string;
}

export default function NewReportPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data: Project[]) => {
        setProjects(data);
        if (data.length > 0) setProjectId(String(data[0].id));
      });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const project = projects.find((p) => String(p.id) === projectId);
    if (project) setTitle(`${project.name} 経費精算書`);

    fetch(`/api/expenses?projectId=${projectId}&unassignedOnly=true`)
      .then((r) => r.json())
      .then((data: Expense[]) => {
        setExpenses(data);
        setSelected(new Set(data.map((e) => e.id)));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const total = expenses
    .filter((e) => selected.has(e.id))
    .reduce((sum, e) => sum + e.amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) {
      setError("対象の経費を1件以上選択してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title,
          expenseIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "作成に失敗しました");
        return;
      }
      router.push(`/reports/${data.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">精算書作成</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">案件</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">タイトル</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm font-medium">
            <span>対象の経費（未精算のみ表示）</span>
            <span className="text-black/50">合計 ¥{total.toLocaleString()}</span>
          </div>
          <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
            {expenses.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-black/50">
                未精算の経費がありません
              </li>
            )}
            {expenses.map((exp) => (
              <li key={exp.id} className="flex items-center gap-3 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={selected.has(exp.id)}
                  onChange={() => toggle(exp.id)}
                />
                <span className="w-24 text-sm text-black/50">{exp.date}</span>
                <span className="flex-1 truncate text-sm">
                  {exp.storeName ?? exp.category}
                </span>
                <span className="text-sm font-medium">¥{exp.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving || expenses.length === 0}
          className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "作成中..." : "精算書を作成する"}
        </button>
      </form>
    </div>
  );
}
