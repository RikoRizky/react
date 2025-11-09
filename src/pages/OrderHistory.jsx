import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getOrdersBySession } from '../services/orderService'
import { supabase } from '../lib/supabase'
import { cleanupExpiredOrders } from '../services/orderCleanupService'

function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('session_id')
    if (!id) {
      id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('session_id', id)
    }
    return id
  })

  useEffect(() => {
    fetchOrders()
    // Run cleanup when component mounts to ensure expired orders are removed
    cleanupExpiredOrders()
  }, [sessionId])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const result = await getOrdersBySession(sessionId)
      if (result.success) {
        setOrders(result.orders || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !search ||
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = !statusFilter || order.payment_status === statusFilter

    return matchesSearch && matchesStatus
  })

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Lunas'
      case 'pending':
        return 'Pending'
      case 'failed':
        return 'Gagal'
      default:
        return status
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Riwayat Pesanan
        </h1>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cari Nomor Pesanan
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nomor pesanan..."
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Lunas</option>
                <option value="failed">Gagal</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {order.order_number}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Tanggal: {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        order.payment_status
                      )}`}
                    >
                      {getStatusLabel(order.payment_status)}
                    </span>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      Rp {new Intl.NumberFormat('id-ID').format(order.total_amount)}
                    </p>
                    {order.payment_status === 'paid' && order.receipt_url && (
                      <a
                        href={order.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                      >
                        Lihat Struk
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="px-6 py-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Item Pesanan:
                </h4>
                <div className="space-y-3">
                  {order.orderItems?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {item.product?.image ? (
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={item.product.image.startsWith('http') 
                                ? item.product.image 
                                : `https://cjyxiahyycakcuhgswat.supabase.co/storage/v1/object/public/products/${item.product.image}`}
                              alt={item.product.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-gray-400"
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
                            {item.product?.name || 'Produk tidak ditemukan'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Qty: {item.quantity} × Rp{' '}
                            {new Intl.NumberFormat('id-ID').format(item.price)}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        Rp {new Intl.NumberFormat('id-ID').format(item.total)}
                      </div>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Catatan:
                    </h4>
                    <p className="text-sm text-gray-600">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
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
                d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15v-3h4v3H8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Belum ada pesanan
          </h3>
          <p className="text-gray-500 mb-4">
            Anda belum melakukan pembelian apapun.
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

export default OrderHistory
