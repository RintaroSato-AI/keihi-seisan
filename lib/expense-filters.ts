import type { Prisma } from "@prisma/client";

export function buildExpenseWhere(searchParams: URLSearchParams): Prisma.ExpenseWhereInput {
  const projectId = searchParams.get("projectId");
  const category = searchParams.get("category");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const unassignedOnly = searchParams.get("unassignedOnly");

  return {
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
  };
}
