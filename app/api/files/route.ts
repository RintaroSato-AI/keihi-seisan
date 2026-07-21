import { NextRequest, NextResponse } from "next/server";
import { getVercelOidcToken } from "@vercel/oidc";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("u");

  if (!url) {
    return NextResponse.json({ error: "urlが必要です" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "不正なurlです" }, { status: 400 });
  }

  // Vercel Blobのホスト以外へのアクセスを禁止（SSRF対策）
  if (!parsed.hostname.endsWith(".blob.vercel-storage.com")) {
    return NextResponse.json({ error: "許可されていないホストです" }, { status: 400 });
  }

  let oidcToken: string | undefined;
  try {
    oidcToken = await getVercelOidcToken();
  } catch {
    oidcToken = undefined;
  }

  const res = await fetch(parsed.toString(), {
    headers: oidcToken ? { Authorization: `Bearer ${oidcToken}` } : undefined,
  });

  if (!res.ok || !res.body) {
    return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 404 });
  }

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
