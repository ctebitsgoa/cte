/** Longest edge (px) we keep for an uploaded image. */
export const MAX_IMAGE_DIMENSION = 1600

/** Re-encode quality for the lossy formats (ignored for PNG). */
const IMAGE_QUALITY = 0.85

/**
 * Formats we can safely re-encode. SVG has to stay vector, and GIF may be
 * animated — a canvas round-trip would flatten it to a single frame.
 */
const RESIZABLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, IMAGE_QUALITY))
}

/**
 * Shrinks an oversized image in the browser before it goes to Storage, so we
 * never park a multi-megabyte original there and then pay egress on it every
 * time someone loads the page.
 *
 * The original MIME type is preserved, so the file extension and the bucket's
 * allowed_mime_types both stay valid. Anything we can't handle — and any
 * failure along the way — falls through to the untouched file, and we keep the
 * original whenever re-encoding didn't actually make it smaller.
 */
export async function downscaleImage(
  file: File,
  maxDimension = MAX_IMAGE_DIMENSION
): Promise<File> {
  if (typeof window === 'undefined' || !RESIZABLE_TYPES.has(file.type)) return file

  let bitmap: ImageBitmap
  try {
    // from-image so EXIF-rotated phone photos don't come out sideways
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return file
  }

  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await toBlob(canvas, file.type)
    if (!blob || blob.size >= file.size) return file

    return new File([blob], file.name, { type: file.type, lastModified: file.lastModified })
  } catch {
    return file
  } finally {
    bitmap.close()
  }
}
