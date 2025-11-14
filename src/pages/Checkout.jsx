import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { supabase } from '../lib/supabase'
import { createOrder } from '../services/orderService'
import { generateSecureReceipt } from '../utils/receiptGenerator'
import toast from 'react-hot-toast'

function Checkout() {
  const navigate = useNavigate()
  const { getCartItems, getTotalAmount, clearCart } = useCartStore()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const [sessionId] = useState(() => {
    let id = localStorage.getItem('session_id')
    if (!id) {
      id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('session_id', id)
    }
    return id
  })

  const [formData, setFormData] = useState({
    customer_name: localStorage.getItem('customer_name') || '',
    customer_email: localStorage.getItem('customer_email') || '',
    customer_phone: localStorage.getItem('customer_phone') || '',
    notes: '',
  })

  const cartItems = getCartItems()
  const productIds = Object.keys(cartItems)
  const totalAmount = getTotalAmount()

  useEffect(() => {
    if (productIds.length === 0) {
      toast.error('Keranjang kosong!')
      navigate('/products')
      return
    }
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .in('id', productIds)

      if (error) throw error

      const itemsWithProducts = data.map((product) => ({
        ...cartItems[product.id],
        product,
      }))

      setItems(itemsWithProducts)

      // Validate stock
      for (const item of itemsWithProducts) {
        if (item.product.stock < item.quantity) {
          toast.error(
            `Stok ${item.product.name} tidak cukup! Stok tersedia: ${item.product.stock}`
          )
          navigate('/cart')
          return
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Gagal memuat produk')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)

    try {
      // Save customer data to localStorage
      localStorage.setItem('customer_name', formData.customer_name)
      localStorage.setItem('customer_email', formData.customer_email)
      localStorage.setItem('customer_phone', formData.customer_phone)

      // Create order
      const orderItems = Object.values(cartItems).map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }))

      const orderResult = await createOrder({
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        total_amount: totalAmount,
        notes: formData.notes,
        session_id: sessionId,
        items: orderItems,
      })

      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Gagal membuat pesanan')
      }

      // Generate receipt image
      const order = orderResult.order
      toast('Membuat nota pesanan...', { duration: 3000 })

      const receiptData = await generateSecureReceipt(order, items)

      // Convert image blob to base64 for WhatsApp and download
      const reader = new FileReader()
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(receiptData.imageBlob)
      })

      const base64Image = await base64Promise

      // Automatically download the receipt image
      const downloadLink = document.createElement('a')
      downloadLink.href = base64Image
      downloadLink.download = `nota_${order.order_number}.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)

      toast.success('Nota pesanan berhasil diunduh!', { duration: 3000 })

      // Generate WhatsApp message
      const whatsappMessage = encodeURIComponent(
        `🛒 *PESANAN BARU*\n\n` +
        `📋 *Detail Pesanan:*\n` +
        `Nomor Pesanan: ${order.order_number}\n` +
        `Nama: ${formData.customer_name}\n` +
        `Email: ${formData.customer_email}\n` +
        `Telepon: ${formData.customer_phone}\n` +
        `Total: Rp ${new Intl.NumberFormat('id-ID').format(totalAmount)}\n\n` +
        `📦 *Produk:*\n` +
        items.map(item =>
          `- ${item.product.name} (${item.quantity}x) - Rp ${new Intl.NumberFormat('id-ID').format(item.quantity * item.price)}`
        ).join('\n') +
        (formData.notes ? `\n\n📝 Catatan: ${formData.notes}` : '') +
        `\n\n💰 *Silakan transfer ke rekening berikut:*\n` +
        `Bank BCA: 1234567890\n` +
        `A/N: Nama Toko\n\n` +
        `Kirim bukti transfer beserta nota pesanan yang sudah terunduh ke WhatsApp ini.`
      )

      // Open WhatsApp with message after a short delay to ensure download completes
      setTimeout(() => {
        const whatsappUrl = `https://wa.me/6281223209190?text=${whatsappMessage}`
        window.open(whatsappUrl, '_blank')
      }, 1000)

      // Clear cart and redirect
      clearCart()
      toast.success('Pesanan berhasil dibuat! Silakan selesaikan pembayaran via WhatsApp.')
      navigate('/products')
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error.message || 'Gagal memproses checkout')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Ringkasan Pesanan
          </h2>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between py-3 border-b border-gray-200"
              >
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
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {item.product.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  Rp{' '}
                  {new Intl.NumberFormat('id-ID').format(
                    item.quantity * item.price
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-green-600">
                Rp {new Intl.NumberFormat('id-ID').format(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Informasi Pelanggan
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap *
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nama lengkap"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Telepon *
              </label>
              <input
                type="text"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="081234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Catatan khusus untuk pesanan..."
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Informasi Pembayaran
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>• Anda akan diarahkan ke WhatsApp untuk pembayaran</p>
                    <p>• Akan ada nota yang otomatis terunduh</p>
                    <p>• Silakan mengirim nota kepada admin melalu WhatsApp</p>
                    <p>• Silakan mengirim bukti pembayaran kepada admin melalu WhatsApp</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Kembali ke Keranjang
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Memproses...' : 'Lanjutkan ke Pembayaran'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Checkout