import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const reports = await prisma.expenseReport.findMany({
    orderBy: { generatedAt: "desc" },
    include: { project: true, _count: { select: { expenses: true } } },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">精算書一覧</h1>
      <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
        {reports.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-black/50">
            作成済みの精算書がありません
          </li>
        )}
        {reports.map((r) => (
          <li key={r.id}>
            <Link
              href={`/reports/${r.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-black/5"
            >
              <div>
                <div className="font-medium">{r.title}</div>
                <div className="text-sm text-black/50">
                  {r.project.name} ・ {r.generatedAt.toISOString().slice(0, 10)} ・ {r._count.expenses}件
                </div>
              </div>
              <span className="font-semibold">¥{r.totalAmount.toLocaleString()}</span>
            </Link>
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
