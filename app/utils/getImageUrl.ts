type ImageSize = 'thumbnail' | 'medium' | 'full'

const SIZE_CONFIG: Record<ImageSize, { width: number; height: number } | null> = {
  thumbnail: { width: 400, height: 300 },
  medium: { width: 1280, height: 720 },
  full: null,
}

/**
 * 将 Supabase Storage URL 转换为带变换参数的 URL
 *
 * 注意: Supabase Image Transformations 需要 Pro 计划
 * 免费计划下此函数直接返回原 URL
 *
 * 如果升级到 Pro 计划，可以将 ENABLE_TRANSFORMATIONS 设为 true
 *
 * @param url - 原始 Supabase Storage URL
 * @param size - 目标尺寸: 'thumbnail' | 'medium' | 'full'
 * @returns 变换后的 URL，如果是 full 或功能未启用则返回原 URL
 */
export function getImageUrl(
  url: string | null | undefined,
  _size: ImageSize = 'full'
): string | null {
  if (!url) return null

  // Supabase 免费计划不支持 Image Transformations
  // 升级到 Pro 计划后，将此设为 true 并启用下方代码
  const ENABLE_TRANSFORMATIONS = false

  if (!ENABLE_TRANSFORMATIONS) {
    return url
  }

  const config = SIZE_CONFIG[_size]
  if (!config) return url

  // Supabase Storage URL 格式:
  // https://xxx.supabase.co/storage/v1/object/public/bucket-name/path
  // 变换 URL 格式:
  // https://xxx.supabase.co/storage/v1/render/image/public/bucket-name/path?width=x&height=y

  // 只处理 Supabase Storage URL
  if (!url.includes('/storage/v1/object/')) {
    return url
  }

  const transformUrl = url.replace('/storage/v1/object/', '/storage/v1/render/image/')
  return `${transformUrl}?width=${config.width}&height=${config.height}&resize=cover&quality=80`
}
