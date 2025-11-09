import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { updateOrderPaymentStatus, uploadPaymentProof } from '../../services/orderService'
import toast from 'react-hot-toast'

function AdminOrderManagement() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [paymentProof, setPaymentProof] = useState(null)
  const [paymentProofPreview, setPaymentProofPreview] = useState(null)
  const [processingOrder, setProcessingOrder] = useState(null)

  useEffect(() => {
    fetchPendingOrders()
  }, [])

  const fetchPendingOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          orderItems:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching pending orders:', error)
      toast.error('Gagal memuat pesanan pending')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (order) => {
    setSelectedOrder(order)
    setPaymentProof(null)
    setPaymentProofPreview(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedOrder(null)
    setPaymentProof(null)
    setPaymentProofPreview(null)
  }

  const handlePaymentProofChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPaymentProof(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!selectedOrder || !paymentProof) {
      toast.error('Silakan upload bukti pembayaran')
      return
    }

    try {
      setProcessingOrder(selectedOrder.id)

      // Upload payment proof
      const paymentProofPath = await uploadPaymentProof(paymentProof)

      // Update order status to paid with payment proof
      const result = await updateOrderPaymentStatus(
        selectedOrder.order_number,
        'paid',
        paymentProofPath
      )

      if (result.success) {
        toast.success('Pesanan berhasil ditandai sebagai dibayar!')
        closeModal()
        fetchPendingOrders()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error marking order as paid:', error)
      toast.error('Gagal menandai pesanan sebagai dibayar')
    } finally {
      setProcessingOrder(null)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPaymentProofUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `https://cjyxiahyycakcuhgswat.supabase.co/storage/v1/object/public/products/${path}`
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
      <div className="mb-8 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-extrabold flex items-center mb-3 text-white drop-shadow-lg">
              <svg
                className="w-12 h-12 mr-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Kelola Pesanan
            </h1>
            <p className="text-white text-xl font-semibold opacity-95 drop-shadow-md">
              Kelola pesanan pending dan tandai sebagai dibayar
            </p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-6 border-b-4 border-blue-800 shadow-lg">
          <h2 className="text-2xl font-bold text-white">Pesanan Pending</h2>
        </div>
        <div className="max-h-[800px] overflow-y-auto">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div
                key={order.id}
                className="p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-3 flex-wrap gap-2">
                      <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg">
                        {order.order_number}
                      </span>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-500 text-white">
                        ⏳ Pending
                      </span>
                    </div>
                    <p className="text-base font-bold text-gray-900 mb-2">
                      {order.customer_name}
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      {formatDate(order.created_at)}
                    </p>
                    <p className="text-xl font-bold text-green-600 mb-3">
                      Rp {new Intl.NumberFormat('id-ID').format(order.total_amount)}
                    </p>

                    {/* Order Items */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Detail Pesanan:</p>
                      {order.orderItems?.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm text-gray-600 mb-1">
                          <span>{item.product?.name} (x{item.quantity})</span>
                          <span>Rp {new Intl.NumberFormat('id-ID').format(item.total)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Timer */}
                    <p className="text-xs text-gray-500">
                      {(() => {
                        const now = new Date()
                        const orderTime = new Date(order.created_at)
                        const diffMs = now - orderTime
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

                        if (diffHours >= 24) {
                          return '⏰ Akan dihapus otomatis'
                        } else {
                          const remainingHours = 23 - diffHours
                          const remainingMinutes = 59 - diffMinutes
                          return `⏰ ${remainingHours}j ${remainingMinutes}m lagi`
                        }
                      })()}
                    </p>
                  </div>
                  <button
                    onClick={() => openModal(order)}
                    className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 font-medium text-sm ml-4"
                  >
                    ✓ Tandai Dibayar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg font-medium">Tidak ada pesanan pending</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 px-5 py-4 rounded-t-xl flex items-center justify-between z-10">
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
                Tandai Pesanan Dibayar
              </h3>
              <div className="w-7"></div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Order Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Detail Pesanan</h4>
                <p className="text-sm text-gray-600">Nomor: {selectedOrder.order_number}</p>
                <p className="text-sm text-gray-600">Pelanggan: {selectedOrder.customer_name}</p>
                <p className="text-sm text-gray-600">Total: Rp {new Intl.NumberFormat('id-ID').format(selectedOrder.total_amount)}</p>
              </div>

              {/* Payment Proof Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bukti Pembayaran *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePaymentProofChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  required
                />
                {paymentProofPreview && (
                  <div className="mt-3">
                    <img
                      src={paymentProofPreview}
                      alt="Payment Proof Preview"
                      className="max-w-full h-48 object-contain rounded-lg border-2 border-gray-200"
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  disabled={processingOrder === selectedOrder.id}
                >
                  Batal
                </button>
                <button
                  onClick={handleMarkAsPaid}
                  disabled={!paymentProof || processingOrder === selectedOrder.id}
                  className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingOrder === selectedOrder.id ? 'Memproses...' : 'Tandai Dibayar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrderManagement
