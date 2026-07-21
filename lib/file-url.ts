/** DBに保存されたパスをブラウザから見られるURLに変換する。 */
export function toViewUrl(pathOrUrl: string | null): string | null {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http")) {
    return `/api/files?u=${encodeURIComponent(pathOrUrl)}`;
  }
  return pathOrUrl;
}
