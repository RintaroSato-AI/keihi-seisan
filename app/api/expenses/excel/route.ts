import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildExpenseWhere } from "@/lib/expense-filters";
import { generateExpensesExcelBuffer } from "@/lib/generate-expenses-excel";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const expenses = await prisma.expense.findMany({
    where: buildExpenseWhere(searchParams),
    include: { project: true },
    orderBy: { date: "desc" },
  });

  const buffer = await generateExpensesExcelBuffer({
    title: "経費一覧",
    expenses: expenses.map((e) => ({
      date: e.date,
      projectName: e.project.name,
      storeName: e.storeName,
      category: e.category,
      amount: e.amount,
      memo: e.memo,
    })),
  });

  const filename = `経費一覧_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
