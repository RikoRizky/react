/**
 * Helper function untuk mendapatkan URL gambar produk dari Supabase Storage
 */
export const getProductImageUrl = (imagePath) => {
  if (!imagePath) return null
  
  // Jika sudah full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  // Jika relative path, tambahkan Supabase Storage URL
  return `https://cjyxiahyycakcuhgswat.supabase.co/storage/v1/object/public/products/${imagePath}`
}
