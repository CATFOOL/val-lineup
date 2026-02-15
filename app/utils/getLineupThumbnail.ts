export function getLineupThumbnail(
  media: { url: string; sort_order?: number; is_cover?: boolean }[],
): string | null {
  if (!media?.length) return null;
  const cover = media.find((m) => m.is_cover);
  if (cover) return cover.url;
  const sorted = [...media].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  return sorted[0]?.url ?? null;
}
