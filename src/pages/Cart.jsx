import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

function Cart() {
  const {
    getCartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalAmount,
  } = useCartStore()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const cartItems = getCartItems()
  const productIds = Object.keys(cartItems)

  useEffect(() => {
    fetchProducts()
  }, [productIds.length])

  const fetchProducts = async () => {
    if (productIds.length === 0) {
      setItems([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .in('id', productIds)

      if (error) throw error

      // Merge cart items with product data
      const itemsWithProducts = data.map((product) => ({
        ...cartItems[product.id],
        product,
      }))

      setItems(itemsWithProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Gagal memuat produk')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = (productId, quantity) => {
    const product = items.find((item) => item.product.id === productId)?.product
    if (!product) return

    if (quantity <= 0) {
      removeFromCart(productId)
      toast.success('Produk berhasil dihapus dari keranjang!')
    } else {
      updateQuantity(productId, quantity, product.stock)
      toast.success('Jumlah produk berhasil diperbarui!')
    }
    fetchProducts()
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const handleRemove = (productId) => {
    removeFromCart(productId)
    toast.success('Produk berhasil dihapus dari keranjang!')
    fetchProducts()
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const handleClearCart = () => {
    if (window.confirm('Yakin ingin mengosongkan keranjang?')) {
      clearCart()
      toast.success('Keranjang berhasil dikosongkan!')
      fetchProducts()
      window.dispatchEvent(new Event('cartUpdated'))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalAmount = getTotalAmount()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Keranjang Belanja
        </h1>
      </div>

      {items.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex-shrink-0">
                          {item.product.image ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={item.product.image.startsWith('http')
                                ? item.product.image
                                : `https://cjyxiahyycakcuhgswat.supabase.co/storage/v1/object/public/products/${item.product.image}`}
                              alt={item.product.name}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <svg
                                className="w-6 h-6 text-gray-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.product.category?.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rp {new Intl.NumberFormat('id-ID').format(item.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        {/* Stock Info */}
                        <div className="text-center">
                          <span className="text-xs text-gray-500">
                            Stok: <span className="font-semibold text-green-600">{item.product.stock}</span>
                          </span>
                        </div>

                        <div className="flex items-center">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0
                              const adjustedValue = value > item.product.stock ? item.product.stock : value
                              handleUpdateQuantity(item.product.id, adjustedValue)
                            }}
                            min="1"
                            max={item.product.stock}
                            className="mx-3 w-16 text-center text-sm font-medium border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.product.id, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.product.stock}
                            className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Rp{' '}
                      {new Intl.NumberFormat('id-ID').format(
                        item.quantity * item.price
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRemove(item.product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {items.map((item) => (
              <div key={item.product.id} className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="h-16 w-16 flex-shrink-0">
                    {item.product.image ? (
                      <img
                        className="h-16 w-16 rounded-lg object-cover"
                        src={item.product.image.startsWith('http')
                          ? item.product.image
                          : `https://cjyxiahyycakcuhgswat.supabase.co/storage/v1/object/public/products/${item.product.image}`}
                        alt={item.product.name}
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.product.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.product.category?.name}
                    </div>
                    <div className="mt-2 text-sm text-gray-900">
                      Rp {new Intl.NumberFormat('id-ID').format(item.price)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleUpdateQuantity(item.product.id, item.quantity - 1)
                      }
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        const adjustedValue = value > item.product.stock ? item.product.stock : value
                        handleUpdateQuantity(item.product.id, adjustedValue)
                      }}
                      min="1"
                      max={item.product.stock}
                      className="w-16 text-center text-sm font-medium border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() =>
                        handleUpdateQuantity(item.product.id, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.product.stock}
                      className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemove(item.product.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Hapus
                  </button>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Stok: <span className="font-semibold text-green-600">{item.product.stock}</span>
                </div>

                <div className="mt-2 text-sm font-medium text-gray-900">
                  Total: Rp {new Intl.NumberFormat('id-ID').format(item.quantity * item.price)}
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="bg-gray-50 px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div className="text-lg font-medium text-gray-900">
                Total:{' '}
                <span className="text-2xl font-bold text-green-600">
                  Rp {new Intl.NumberFormat('id-ID').format(totalAmount)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleClearCart}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Kosongkan Keranjang
                </button>
                <Link
                  to="/checkout"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 text-center"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zM8 6a2 2 0 114 0v1H8V6zm8 10H4v-2h12v2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Keranjang Kosong
          </h3>
          <p className="text-gray-500 mb-4">
            Belum ada produk di keranjang Anda.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Mulai Belanja
          </Link>
        </div>
      )}
    </div>
  )
}

export default Cart
