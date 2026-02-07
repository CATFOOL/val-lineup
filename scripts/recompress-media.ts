/**
 * 媒体文件重新压缩脚本
 *
 * 将 Supabase Storage 中大于 0.5MB 的图片重新压缩为 WebP 格式
 * 对齐前端 compressImage.ts 的压缩参数（maxSizeMB: 0.5, maxWidthOrHeight: 1920, WebP）
 *
 * 处理范围：
 * - lineup-media bucket 中的所有图片
 * - collection-covers bucket 中的所有封面
 * - 跳过视频和 GIF
 *
 * 使用方法：
 *   pnpm tsx scripts/recompress-media.ts            # 实际执行
 *   pnpm tsx scripts/recompress-media.ts --dry-run   # 只统计，不修改
 */

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

// ============ 配置 ============
// 通过环境变量传入，或使用默认本地地址
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ 请设置环境变量 SUPABASE_SERVICE_KEY')
  console.error('   用法: SUPABASE_SERVICE_KEY=your_key pnpm tsx scripts/recompress-media.ts')
  process.exit(1)
}

// 压缩参数（对齐前端 compressImage.ts）
const MAX_SIZE_BYTES = 0.5 * 1024 * 1024 // 0.5MB
const MAX_DIMENSION = 1920
const WEBP_QUALITY = 80
// ==============================

const DRY_RUN = process.argv.includes('--dry-run')
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface Stats {
  total: number
  compressed: number
  skipped: number
  alreadySmall: number
  failed: number
  savedBytes: number
}

const stats: Stats = {
  total: 0,
  compressed: 0,
  skipped: 0,
  alreadySmall: 0,
  failed: 0,
  savedBytes: 0,
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function extractStoragePath(url: string, bucket: string): string | null {
  const match = url.match(new RegExp(`${bucket}/(.+)$`))
  return match ? match[1] : null
}

function getExtension(path: string): string {
  const match = path.match(/\.([^.?]+)(?:\?.*)?$/)
  return match ? match[1].toLowerCase() : ''
}

function replaceExtension(path: string, newExt: string): string {
  return path.replace(/\.[^.]+$/, `.${newExt}`)
}

async function compressAndUpload(
  bucket: string,
  storagePath: string,
  originalSize: number,
): Promise<{ newPath: string; newSize: number } | null> {
  const ext = getExtension(storagePath)

  // 跳过 GIF（保留动画）和视频
  if (ext === 'gif' || ['mp4', 'webm', 'mov'].includes(ext)) {
    stats.skipped++
    console.log(`   ⏭️  跳过 (${ext}): ${storagePath}`)
    return null
  }

  // 下载文件
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(bucket)
    .download(storagePath)

  if (downloadError || !fileData) {
    stats.failed++
    console.error(`   ❌ 下载失败: ${storagePath}`, downloadError?.message)
    return null
  }

  const fileBuffer = Buffer.from(await fileData.arrayBuffer())
  const actualSize = fileBuffer.length

  // 如果已经小于阈值，跳过
  if (actualSize <= MAX_SIZE_BYTES) {
    stats.alreadySmall++
    console.log(`   ✅ 已小于阈值 (${formatBytes(actualSize)}): ${storagePath}`)
    return null
  }

  console.log(`   🔄 压缩中 (${formatBytes(actualSize)}): ${storagePath}`)

  if (DRY_RUN) {
    stats.compressed++
    return null
  }

  // 用 sharp 压缩为 WebP
  const compressed = await sharp(fileBuffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()

  const newPath = ext === 'webp' ? storagePath : replaceExtension(storagePath, 'webp')

  // 上传压缩后的文件
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(newPath, compressed, {
      contentType: 'image/webp',
      upsert: true,
    })

  if (uploadError) {
    stats.failed++
    console.error(`   ❌ 上传失败: ${newPath}`, uploadError.message)
    return null
  }

  // 如果扩展名改了，删除旧文件
  if (newPath !== storagePath) {
    const { error: removeError } = await supabase.storage
      .from(bucket)
      .remove([storagePath])
    if (removeError) {
      console.warn(`   ⚠️  删除旧文件失败: ${storagePath}`, removeError.message)
    }
  }

  const saved = actualSize - compressed.length
  stats.compressed++
  stats.savedBytes += saved
  console.log(`   ✅ ${formatBytes(actualSize)} → ${formatBytes(compressed.length)} (节省 ${formatBytes(saved)})`)

  return { newPath, newSize: compressed.length }
}

async function processLineupMedia() {
  console.log('\n' + '='.repeat(50))
  console.log('📸 处理 Lineup Media')
  console.log('='.repeat(50))

  // 分页获取所有图片类型的 media
  const allMedia: any[] = []
  const PAGE_SIZE = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('lineup_media')
      .select('id, url, media_type')
      .eq('media_type', 'image')
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error('❌ 查询 lineup_media 失败:', error.message)
      return
    }
    if (!data || data.length === 0) break
    allMedia.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  console.log(`   找到 ${allMedia.length} 个图片记录`)
  stats.total += allMedia.length

  for (const media of allMedia) {
    const storagePath = extractStoragePath(media.url, 'lineup-media')
    if (!storagePath) {
      console.warn(`   ⚠️  无法解析路径: ${media.url}`)
      stats.failed++
      continue
    }

    const result = await compressAndUpload('lineup-media', storagePath, 0)

    // 如果路径变了（扩展名从 jpg/png 变成 webp），更新数据库 URL
    if (result && result.newPath !== storagePath) {
      const newUrl = media.url.replace(storagePath, result.newPath)

      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from('lineup_media')
          .update({ url: newUrl })
          .eq('id', media.id)

        if (updateError) {
          console.error(`   ❌ 更新 URL 失败: ${media.id}`, updateError.message)
        } else {
          console.log(`   📝 URL 已更新`)
        }
      }
    }
  }
}

async function processCollectionCovers() {
  console.log('\n' + '='.repeat(50))
  console.log('🖼️  处理 Collection Covers')
  console.log('='.repeat(50))

  const { data: collections, error } = await supabase
    .from('collections')
    .select('id, cover_url')
    .not('cover_url', 'is', null)

  if (error) {
    console.error('❌ 查询 collections 失败:', error.message)
    return
  }

  const withCovers = (collections || []).filter((c: any) => c.cover_url)
  console.log(`   找到 ${withCovers.length} 个有封面的 collection`)
  stats.total += withCovers.length

  for (const col of withCovers) {
    const storagePath = extractStoragePath(col.cover_url, 'collection-covers')
    if (!storagePath) {
      console.warn(`   ⚠️  无法解析路径: ${col.cover_url}`)
      stats.failed++
      continue
    }

    const result = await compressAndUpload('collection-covers', storagePath, 0)

    if (result && result.newPath !== storagePath) {
      const newUrl = col.cover_url.replace(storagePath, result.newPath)

      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from('collections')
          .update({ cover_url: newUrl })
          .eq('id', col.id)

        if (updateError) {
          console.error(`   ❌ 更新 cover_url 失败: ${col.id}`, updateError.message)
        } else {
          console.log(`   📝 URL 已更新`)
        }
      }
    }
  }
}

async function main() {
  console.log('🚀 媒体文件重新压缩脚本')
  console.log(`   目标环境: ${SUPABASE_URL}`)
  console.log(`   压缩参数: WebP quality=${WEBP_QUALITY}, max=${MAX_DIMENSION}px, threshold=${formatBytes(MAX_SIZE_BYTES)}`)
  if (DRY_RUN) {
    console.log('   ⚠️  DRY RUN 模式 - 不会修改任何文件')
  }

  await processLineupMedia()
  await processCollectionCovers()

  console.log('\n' + '='.repeat(50))
  console.log('📊 统计')
  console.log('='.repeat(50))
  console.log(`   总计:     ${stats.total}`)
  console.log(`   已压缩:   ${stats.compressed}`)
  console.log(`   已足够小: ${stats.alreadySmall}`)
  console.log(`   跳过:     ${stats.skipped} (GIF/视频)`)
  console.log(`   失败:     ${stats.failed}`)
  if (!DRY_RUN) {
    console.log(`   节省空间: ${formatBytes(stats.savedBytes)}`)
  }
  console.log('\n✅ 完成！')
}

main().catch(console.error)
