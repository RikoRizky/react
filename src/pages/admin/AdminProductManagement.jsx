import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

function AdminProductManagement() {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate('/admin/login')
      return
    }
    if (isAdmin === false) {
      navigate('/admin/login')
      return
    }
  }, [user, isAdmin, navigate])

  // Dynamic categories from database
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    sku: '',
    category_id: '',
    is_active: true,
    image: null,
  })

  const [existingImage, setExistingImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    fetchCategories()
    fetchProducts()

    // Check if product_id is in URL
    const productId = searchParams.get('product_id')
    if (productId) {
      openModal(productId)
    }
  }, [search])

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Gagal memuat kategori')
    } finally {
      setCategoriesLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      console.log('Fetching products...')
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase error fetching products:', error)
        throw error
      }
      console.log('Products fetched:', data)
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Gagal memuat produk')
    } finally {
      setLoading(false)
    }
  }

  const openModal = async (id = null) => {
    resetForm()
    setShowModal(true)

    if (id) {
      setEditingId(id)
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        setFormData({
          name: data.name || '',
          description: data.description || '',
          price: data.price || '',
          stock: data.stock || '',
          sku: data.sku || '',
          category_id: data.category_id || '',
          is_active: data.is_active !== false,
          image: null,
        })

        setExistingImage(data.image)
        if (data.image) {
          setImagePreview(
            data.image.startsWith('http') 
              ? data.image 
              : `https://cjyxiahyycakcuhgswat.supabase.co/storage/v1/object/public/products/${data.image}`
          )
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        toast.error('Gagal memuat produk')
      }
    }
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
    setSearchParams({})
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      sku: '',
      category_id: '',
      is_active: true,
      image: null,
    })
    setExistingImage(null)
    setImagePreview(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, image: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      return filePath
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()

    try {
      console.log('Saving product...')
      let imagePath = existingImage

      // Upload new image if provided
      if (formData.image) {
        console.log('Uploading new image...')
        // Delete old image if editing
        if (existingImage) {
          await supabase.storage.from('products').remove([existingImage])
        }

        imagePath = await uploadImage(formData.image)
        console.log('Image uploaded:', imagePath)
      }

      const data = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        sku: formData.sku || null,
        category_id: parseInt(formData.category_id) || null,
        is_active: formData.is_active,
        image: imagePath,
      }

      console.log('Product data to save:', data)

      if (editingId) {
        console.log('Updating product with ID:', editingId)
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', editingId)

        if (error) {
          console.error('Supabase update error:', error)
          throw error
        }
        toast.success('Produk berhasil diperbarui!')
      } else {
        console.log('Inserting new product')
        const { error } = await supabase.from('products').insert([data])

        if (error) {
          console.error('Supabase insert error:', error)
          throw error
        }
        toast.success('Produk berhasil ditambahkan!')
      }

      closeModal()
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error(error.message || 'Gagal menyimpan produk')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus produk ini?')) return

    try {
      // Get product to delete image
      const { data: product } = await supabase
        .from('products')
        .select('image')
        .eq('id', id)
        .single()

      // Delete image if exists
      if (product?.image) {
        await supabase.storage.from('products').remove([product.image])
      }

      // Delete product
      const { error } = await supabase.from('products').delete().eq('id', id)

      if (error) throw error
      toast.success('Produk berhasil dihapus!')
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Gagal menghapus produk')
    }
  }

  const handleUpdateStock = async (id, amount) => {
    try {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', id)
        .single()

      if (!product) throw new Error('Produk tidak ditemukan')

      const newStock = product.stock + amount
      if (newStock < 0) {
        toast.error('Stok tidak bisa negatif!')
        return
      }

      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', id)

      if (error) throw error
      toast.success('Stok berhasil diperbarui!')
      fetchProducts()
    } catch (error) {
      console.error('Error updating stock:', error)
      toast.error('Gagal memperbarui stok')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <svg
              className="w-8 h-8 mr-3 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            Kelola Produk
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Tambah, edit, atau hapus produk
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Tambah Produk
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearch(searchInput)
              }
            }}
            placeholder="Cari produk..."
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <button
            onClick={() => setSearch(searchInput)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 rounded-t-xl flex items-center justify-between z-10">
              <button
                onClick={closeModal}
                className="text-white hover:text-gray-200 transition-colors p-1"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Edit Produk' : 'Tambah Produk'}
              </h3>
              <div className="w-7"></div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Image Preview */}
              {(imagePreview || existingImage) && (
                <div className="flex justify-center mb-4">
                  <img
                    src={imagePreview || `https://cjyxiahyycakcuhgswat.supabase.co/storage/v1/object/public/products/${existingImage}`}
                    alt="Preview"
                    className="h-32 w-32 rounded-lg object-cover border-4 border-blue-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gambar Produk
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nama produk"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="3"
                  className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  placeholder="Deskripsi produk (opsional)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kategori *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  required
                  className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Harga *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                      step="0.01"
                      min="0"
                      className="block w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stok *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    required
                    min="0"
                    className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SKU (opsional)
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  placeholder="SKU produk"
                />
              </div>

              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="is_active"
                  className="ml-3 text-sm font-medium text-gray-700"
                >
                  Produk Aktif
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Produk
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Kategori
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Harga
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Stok
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-200 mr-4 overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image.startsWith('http')
                                ? product.image
                                : `https://cjyxiahyycakcuhgswat.supabase.co/storage/v1/object/public/products/${product.image}`}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextElementSibling.style.display = 'block'
                              }}
                            />
                          ) : null}
                          <svg
                            className={`w-8 h-8 text-gray-400 ${product.image ? 'hidden' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {product.name}
                          </div>
                          {product.sku && (
                            <div className="text-xs text-gray-500 mt-1">
                              SKU: {product.sku}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        Rp {new Intl.NumberFormat('id-ID').format(product.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            product.stock <= 0
                              ? 'bg-red-100 text-red-800'
                              : product.stock < 10
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {product.stock}
                        </span>
                        <button
                          onClick={() => handleUpdateStock(product.id, 10)}
                          className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200"
                          title="Tambah 10"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => handleUpdateStock(product.id, -1)}
                          className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                          title="Kurangi 1"
                        >
                          -1
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openModal(product.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <p className="text-gray-500 font-medium">Tidak ada produk</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Klik "Tambah Produk" untuk menambahkan produk baru
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminProductManagement
