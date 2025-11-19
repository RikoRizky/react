import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

function AdminPaidOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchPaidOrders()
  }, [])

  const fetchPaidOrders = async () => {
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
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching paid orders:', error)
      toast.error('Gagal memuat pesanan yang sudah dibayar')
    } finally {
      setLoading(false)
    }
  }

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Yakin ingin menghapus pesanan ini?')) return

    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId)
      if (error) throw error

      toast.success('Pesanan berhasil dihapus!')
      setOrders(orders.filter((order) => order.id !== orderId))
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Gagal menghapus pesanan')
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
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
              Pesanan Dibayar
            </h1>
            <p className="text-white text-xl font-semibold opacity-95 drop-shadow-md">
              Daftar pesanan yang sudah ditandai sebagai dibayar
            </p>
          </div>
        </div>
      </div>

      {/* Paid Orders List */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100">
        <div className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 px-6 py-6 border-b-4 border-green-800 shadow-lg">
          <h2 className="text-2xl font-bold text-white">Pesanan Dibayar</h2>
        </div>
        <div className="max-h-[800px] overflow-y-auto">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div
                key={order.id}
                className="p-6 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 border-b border-gray-100 flex items-center justify-between last:border-b-0"
              >
                {/* Info Pesanan */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2 flex-wrap gap-2">
                    <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg">
                      {order.order_number}
                    </span>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-600 text-white">
                      💰 Dibayar
                    </span>
                  </div>
                  <p className="text-base font-bold text-gray-900 mb-1">{order.customer_name}</p>
                  <p className="text-xs text-gray-600 mb-1">{formatDate(order.created_at)}</p>
                  <p className="text-xl font-bold text-green-700">
                    Rp {new Intl.NumberFormat('id-ID').format(order.total_amount)}
                  </p>
                </div>

                {/* Tombol di kanan */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 ml-4">
                  <button
                    onClick={() => {
                      setSelectedOrder(order)
                      setShowModal(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow"
                  >
                    Detail
                  </button>
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg font-medium">Belum ada pesanan yang dibayar</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail Pesanan */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-green-700 mb-4">Detail Pesanan</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Nomor Pesanan:</strong> {selectedOrder.order_number}</p>
              <p><strong>Nama:</strong> {selectedOrder.customer_name}</p>
              <p><strong>Email:</strong> {selectedOrder.customer_email || '-'}</p>
              <p><strong>No. Telepon:</strong> {selectedOrder.customer_phone || '-'}</p>
              <p><strong>Deskripsi:</strong> {selectedOrder.description || '-'}</p>
              <p><strong>Tanggal:</strong> {formatDate(selectedOrder.created_at)}</p>
              <p><strong>Total:</strong> Rp {new Intl.NumberFormat('id-ID').format(selectedOrder.total_amount)}</p>
            </div>

            {/* Detail Produk */}
            <div className="mt-4">
              <p className="font-semibold text-gray-800 mb-2">Produk Dipesan:</p>
              <div className="bg-gray-50 rounded-lg p-3">
                {selectedOrder.orderItems?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center mb-1 text-sm">
                    <span>{item.product?.name} (x{item.quantity})</span>
                    <span>Rp {new Intl.NumberFormat('id-ID').format(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bukti Pembayaran */}
            {selectedOrder.payment_proof && (
              <div className="mt-4">
                <p className="font-semibold text-gray-800 mb-2">Bukti Pembayaran:</p>
                <img
                  src={getPaymentProofUrl(selectedOrder.payment_proof)}
                  alt="Bukti Pembayaran"
                  className="rounded-lg border-2 border-gray-200 shadow-sm max-w-xs"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPaidOrders
