import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES } from "@/lib/categories";
import { saveReceiptImage } from "@/lib/receipt-storage";

export const maxDuration = 60;

const client = new Anthropic();

const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "画像ファイルが必要です" }, { status: 400 });
  }

  if (!SUPPORTED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "対応していない画像形式です（JPEG / PNG / WebP / GIFのみ）。iPhoneの場合は設定でHEIC以外に変更してください。" },
      { status: 400 }
    );
  }

  const receiptPath = await saveReceiptImage(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: file.type as
                | "image/jpeg"
                | "image/png"
                | "image/webp"
                | "image/gif",
              data: base64,
            },
          },
          {
            type: "text",
            text: `これは経費精算用のレシート画像です。以下の情報を読み取り、JSON形式のみで出力してください（説明文は不要）。

- storeName: 店名（読み取れない場合は null）
- date: 日付。YYYY-MM-DD形式に変換（年が不明な場合は今年と仮定）。読み取れない場合は null
- amount: 合計金額（税込・数値のみ、カンマなし）。読み取れない場合は null
- category: 次の中から最も適切なものを1つ選択: ${CATEGORIES.join(", ")}

出力例:
{"storeName": "〇〇商店", "date": "2026-07-14", "amount": 1200, "category": "会議費"}`,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  let parsed: {
    storeName: string | null;
    date: string | null;
    amount: number | null;
    category: string | null;
  } = { storeName: null, date: null, amount: null, category: null };

  if (textBlock && textBlock.type === "text") {
    const match = textBlock.text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        // 読み取り失敗時は空のまま返し、ユーザーに手動入力してもらう
      }
    }
  }

  return NextResponse.json({ receiptPath, ...parsed });
}
