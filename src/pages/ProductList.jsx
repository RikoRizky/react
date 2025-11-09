import { useState, useEffect } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useCartStore } from '../store/cartStore'
import toast from 'react-hot-toast'

function ProductList() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')

  const { products, categories, loading, pagination, setPage } = useProducts({
    search,
    selectedCategory,
    sortBy,
    sortDirection,
  })

  const {
    addToCart,
    incrementQuantity,
    decrementQuantity,
    updateQuantity,
    getCartQuantity,
  } = useCartStore()

  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      toast.error('Produk tidak tersedia!')
      return
    }

    const result = addToCart(product)
    if (result.success) {
      toast.success('Produk ditambahkan ke keranjang!')
      window.dispatchEvent(new Event('cartUpdated'))
    } else {
      toast.error(result.error)
    }
  }

  const handleIncrement = (product) => {
    const result = incrementQuantity(product.id, product.stock)
    if (result.success) {
      window.dispatchEvent(new Event('cartUpdated'))
    } else {
      toast.error(result.error)
    }
  }

  const handleDecrement = (productId) => {
    decrementQuantity(productId)
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const handleQuantityChange = (product, value) => {
    const quantity = parseInt(value) || 0
    if (quantity > product.stock) {
      toast.error(
        `Jumlah otomatis disesuaikan dengan stok tersedia: ${product.stock}`
      )
      updateQuantity(product.id, product.stock, product.stock)
    } else {
      updateQuantity(product.id, quantity, product.stock)
    }
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const totalPages = Math.ceil(pagination.total / pagination.perPage)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-2xl p-8 mb-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-extrabold mb-2 drop-shadow-lg">
                  Daftar Produk
                </h1>
                <p className="text-blue-100 text-lg">
                  Temukan produk berkualitas untuk kebutuhan pendidikan TK Anda
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/30 shadow-lg">
                  <div className="text-3xl font-extrabold">
                    {pagination.total}
                  </div>
                  <div className="text-sm text-blue-100 font-semibold mt-1">
                    Produk Tersedia
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-blue-600"
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
                Cari Produk
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearch(searchInput)
                      setPage(1) // Reset to first page when searching
                    }
                  }}
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
                  placeholder="Cari produk yang Anda inginkan..."
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
                  onClick={() => {
                    setSearch(searchInput)
                    setPage(1) // Reset to first page when searching
                  }}
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

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                Kategori
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md appearance-none bg-white cursor-pointer"
              >
                <option value="">Semua Kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                  />
                </svg>
                Urutkan
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md appearance-none bg-white cursor-pointer"
              >
                <option value="name">Nama A-Z</option>
                <option value="price">Harga Terendah</option>
                <option value="created_at">Terbaru</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.length > 0 ? (
          products.map((product) => {
            const cartQuantity = getCartQuantity(product.id)
            const isInCart = cartQuantity > 0

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200 group relative"
              >
                {/* Stock Badge */}
                {product.stock > 0 ? (
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-gray-200">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-gray-800">
                        Stok: <span className="text-green-600">{product.stock}</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 bg-red-500/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-red-600">
                    <span className="text-xs font-bold text-white">
                      Stok Habis
                    </span>
                  </div>
                )}

                {/* Product Image */}
                <div className="h-48 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center relative overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image.startsWith('http')
                        ? product.image
                        : `https://cjyxiahyycakcuhgswat.supabase.co/storage/v1/object/public/products/${product.image}`}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-center p-4">
                      <svg
                        className="w-12 h-12 mx-auto text-blue-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="mb-2">
                    <span className="inline-flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                      {product.category?.name}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="text-gray-600 text-xs mb-2 line-clamp-1 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-green-600">
                        Rp
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {new Intl.NumberFormat('id-ID').format(product.price)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Harga termasuk pajak
                    </p>
                  </div>

                  {/* Stock Info - Always Visible */}
                  <div className="text-center mb-2">
                    <span className="text-xs font-medium text-gray-600">
                      Stok: <span className="text-green-600 font-bold">{product.stock}</span>
                    </span>
                  </div>

                  {isInCart ? (
                    /* Quantity Selector */
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2.5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-3 border-2 border-blue-200/70 shadow-md">
                        <button
                          onClick={() => handleDecrement(product.id)}
                          className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth="3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M20 12H4"
                            />
                          </svg>
                        </button>

                        <input
                          type="number"
                          value={cartQuantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0
                            const adjustedValue = value > product.stock ? product.stock : value
                            handleQuantityChange(product, adjustedValue)
                          }}
                          min="1"
                          max={product.stock}
                          className="w-24 h-12 text-center text-xl font-extrabold text-gray-900 bg-white border-3 border-blue-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-500"
                          style={{ borderWidth: '3px' }}
                        />

                        <button
                          onClick={() => handleIncrement(product)}
                          disabled={cartQuantity >= product.stock}
                          className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth="3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Add to Cart Button */
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                    >
                      {product.stock <= 0 ? (
                        <>
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
                          <span>Stok Habis</span>
                        </>
                      ) : (
                        <>
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
                              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span>Tambah ke Keranjang</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6">
                <svg
                  className="w-12 h-12 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Tidak Ada Produk Ditemukan
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Maaf, produk yang Anda cari tidak tersedia. Silakan coba dengan
                kata kunci atau filter yang berbeda.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setSearch('')
                    setSearchInput('')
                    setPage(1)
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Reset Pencarian
                </button>
                <button
                  onClick={() => setSelectedCategory('')}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
            <div className="flex gap-2">
              <button
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {pagination.page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductList
