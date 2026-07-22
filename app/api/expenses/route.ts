import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildExpenseWhere } from "@/lib/expense-filters";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const expenses = await prisma.expense.findMany({
    where: buildExpenseWhere(searchParams),
    include: { project: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, date, storeName, amount, category, receiptPath, memo } = body;

  if (!projectId || !date || !amount || !category) {
    return NextResponse.json(
      { error: "案件・日付・金額・費目は必須です" },
      { status: 400 }
    );
  }

  const expense = await prisma.expense.create({
    data: {
      projectId: Number(projectId),
      date,
      storeName: storeName || null,
      amount: Number(amount),
      category,
      receiptPath: receiptPath || null,
      memo: memo || null,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
