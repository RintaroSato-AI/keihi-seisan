import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const category = searchParams.get("category");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const unassignedOnly = searchParams.get("unassignedOnly");

  const expenses = await prisma.expense.findMany({
    where: {
      ...(projectId ? { projectId: Number(projectId) } : {}),
      ...(category ? { category } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
      ...(unassignedOnly === "true" ? { reportId: null } : {}),
    },
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
