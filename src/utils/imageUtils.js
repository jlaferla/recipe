// Compress an image dataUrl to max 900px wide, JPEG quality 0.8
// Keeps base64 sizes reasonable for database storage (~100-200KB typical)
export function compressImage(dataUrl, maxWidth = 900, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(dataUrl) // fall back to original on error
    img.src = dataUrl
  })
}
