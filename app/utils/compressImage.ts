import imageCompression from "browser-image-compression";

export interface CompressOptions {
  /** 最大文件大小 MB，默认 0.5 */
  maxSizeMB?: number;
  /** 最大宽度或高度，默认 1920 */
  maxWidthOrHeight?: number;
  /** 使用 Web Worker，默认 true */
  useWebWorker?: boolean;
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

/**
 * 压缩图片文件
 * 仅压缩图片，视频文件直接返回原文件
 *
 * @param file - 要压缩的文件
 * @param options - 压缩选项
 * @returns 压缩后的文件（图片）或原文件（视频）
 */
export async function compressImage(
  file: File,
  options?: CompressOptions,
): Promise<File> {
  // 只处理图片
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // GIF 不压缩（会丢失动画）
  if (file.type === "image/gif") {
    return file;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 如果文件已经小于目标大小，不压缩
  if (file.size <= opts.maxSizeMB * 1024 * 1024) {
    return file;
  }

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: opts.maxSizeMB,
      maxWidthOrHeight: opts.maxWidthOrHeight,
      useWebWorker: opts.useWebWorker,
      fileType: "image/webp", // 输出为 WebP 格式，压缩率更高
    });

    // 保持原文件名但更换扩展名
    const newName = file.name.replace(/\.[^.]+$/, ".webp");

    return new File([compressedFile], newName, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn("Image compression failed, using original:", error);
    return file;
  }
}

/**
 * 批量压缩图片
 */
export async function compressImages(
  files: File[],
  options?: CompressOptions,
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}
