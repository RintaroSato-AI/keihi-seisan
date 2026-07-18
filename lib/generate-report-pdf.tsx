import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer } from "@react-pdf/renderer";
import fs from "fs";
import path from "path";

interface ExpenseRow {
  date: string;
  storeName: string | null;
  category: string;
  amount: number;
  memo: string | null;
  receiptPath: string | null;
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10 },
  title: { fontSize: 16, marginBottom: 4, fontWeight: 700 },
  subtitle: { fontSize: 10, color: "#555", marginBottom: 16 },
  table: { display: "flex", width: "100%", borderTop: 1, borderColor: "#ccc" },
  row: { flexDirection: "row", borderBottom: 1, borderColor: "#eee", paddingVertical: 4, alignItems: "center" },
  headerRow: { flexDirection: "row", borderBottom: 1, borderColor: "#333", paddingVertical: 4, fontWeight: 700, backgroundColor: "#f5f5f5" },
  cellDate: { width: "12%" },
  cellStore: { width: "23%" },
  cellCategory: { width: "15%" },
  cellMemo: { width: "25%" },
  cellAmount: { width: "13%", textAlign: "right" },
  cellReceipt: { width: "12%", alignItems: "center" },
  receiptImg: { width: 36, height: 36, objectFit: "cover" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12, paddingRight: 4 },
  totalLabel: { fontSize: 12, marginRight: 12 },
  totalAmount: { fontSize: 14, fontWeight: 700 },
});

async function receiptToDataUri(receiptPath: string | null): Promise<string | null> {
  if (!receiptPath) return null;
  try {
    if (receiptPath.startsWith("http")) {
      const res = await fetch(receiptPath);
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") ?? "image/jpeg";
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    }

    const filePath = path.join(process.cwd(), "public", receiptPath.replace(/^\//, ""));
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).replace(".", "").replace("jpg", "jpeg");
    return `data:image/${ext};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function generateReportPdfBuffer(params: {
  title: string;
  projectName: string;
  generatedAt: Date;
  expenses: ExpenseRow[];
}): Promise<Buffer> {
  const { title, projectName, generatedAt, expenses } = params;
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const dataUris = await Promise.all(expenses.map((e) => receiptToDataUri(e.receiptPath)));

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          案件: {projectName} ／ 作成日: {generatedAt.toISOString().slice(0, 10)} ／ 件数: {expenses.length}件
        </Text>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={styles.cellDate}>日付</Text>
            <Text style={styles.cellStore}>店名</Text>
            <Text style={styles.cellCategory}>費目</Text>
            <Text style={styles.cellMemo}>備考</Text>
            <Text style={styles.cellAmount}>金額</Text>
            <Text style={styles.cellReceipt}>レシート</Text>
          </View>
          {expenses.map((e, i) => {
            const dataUri = dataUris[i];
            return (
              <View style={styles.row} key={i}>
                <Text style={styles.cellDate}>{e.date}</Text>
                <Text style={styles.cellStore}>{e.storeName ?? "-"}</Text>
                <Text style={styles.cellCategory}>{e.category}</Text>
                <Text style={styles.cellMemo}>{e.memo ?? ""}</Text>
                <Text style={styles.cellAmount}>{`¥${e.amount.toLocaleString()}`}</Text>
                <View style={styles.cellReceipt}>
                  {dataUri && <Image src={dataUri} style={styles.receiptImg} />}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>合計</Text>
          <Text style={styles.totalAmount}>{`¥${total.toLocaleString()}`}</Text>
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
