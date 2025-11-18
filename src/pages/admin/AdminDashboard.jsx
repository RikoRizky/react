import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { cleanupExpiredOrders } from '../../services/orderCleanupService'

function AdminDashboard() {
  const [stats, setStats] = useState({
    total_products: 0,
    low_stock: 0,
    out_of_stock: 0,
    total_stock_value: 0,
    total_orders: 0,
    pending_orders: 0,
    paid_orders: 0,
    total_revenue: 0,
    today_orders: 0,
    today_revenue: 0,
    products_added_this_month: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadStats()

    // Update waktu setiap menit
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Jalankan pembersihan pesanan pending otomatis
  useEffect(() => {
    cleanupExpiredOrders()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)

      // Ambil data produk
      const { data: products, count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact' })

      const lowStock = products?.filter(p => p.stock < 10).length || 0
      const outOfStock = products?.filter(p => p.stock <= 0).length || 0
      const totalStockValue =
        products?.reduce((sum, p) => sum + p.price * p.stock, 0) || 0

      // Ambil data pesanan
      const { data: orders, count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })

      const pendingOrders = orders?.filter(o => o.payment_status === 'pending').length || 0
      const paidOrders = orders?.filter(o => o.payment_status === 'paid').length || 0
      const totalRevenue =
        orders
          ?.filter(o => o.payment_status === 'paid')
          .reduce((sum, o) => sum + parseFloat(o.total_amount), 0) || 0

      // Statistik hari ini - hanya pesanan yang dibuat hari ini
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayOrders =
        orders?.filter(o => {
          const orderDate = new Date(o.created_at)
          orderDate.setHours(0, 0, 0, 0)
          return orderDate.getTime() === today.getTime() && o.payment_status === 'paid'
        }).length || 0
      const todayRevenue =
        orders
          ?.filter(o => {
            const orderDate = new Date(o.created_at)
            orderDate.setHours(0, 0, 0, 0)
            return orderDate.getTime() === today.getTime() && o.payment_status === 'paid'
          })
          .reduce((sum, o) => sum + parseFloat(o.total_amount), 0) || 0

      // Produk baru bulan ini
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      const productsAddedThisMonth =
        products?.filter(p => new Date(p.created_at) >= monthStart).length || 0

      setStats({
        total_products: totalProducts || 0,
        low_stock: lowStock,
        out_of_stock: outOfStock,
        total_stock_value: totalStockValue,
        total_orders: totalOrders || 0,
        pending_orders: pendingOrders,
        paid_orders: paidOrders,
        total_revenue: totalRevenue,
        today_orders: todayOrders,
        today_revenue: todayRevenue,
        products_added_this_month: productsAddedThisMonth,
      })

      // Ambil semua pesanan
      const { data: recentOrdersData } = await supabase
        .from('orders')
        .select('*, orderItems:order_items(*, product:products(*))')
        .order('created_at', { ascending: false })
        .limit(50)

      // Filter agar pesanan paid lebih dari 24 jam tidak tampil
      const now = new Date()
      const filteredOrders = (recentOrdersData || []).filter(order => {
        const orderTime = new Date(order.created_at)
        const diffMs = now - orderTime
        const diffHours = diffMs / (1000 * 60 * 60)

        // Paid lebih dari 24 jam -> tidak tampil di dashboard
        if (order.payment_status === 'paid' && diffHours > 24) return false
        return true
      })

      setRecentOrders(filteredOrders)

      // Produk stok rendah
      const { data: lowStockData } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .lt('stock', 10)
        .order('stock', { ascending: true })
        .limit(10)

      setLowStockProducts(lowStockData || [])
    } catch (error) {
      console.error('Error loading stats:', error)
      toast.error('Gagal memuat statistik')
    } finally {
      setLoading(false)
    }
  }

  const deleteOrder = async orderId => {
    if (!window.confirm('Yakin ingin menghapus pesanan ini?')) return

    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId)
      if (error) throw error

      toast.success('Pesanan berhasil dihapus!')
      loadStats()
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Gagal menghapus pesanan')
    }
  }

  const formatDate = dateString => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Dashboard Admin
            </h1>
            <p className="text-white text-xl font-semibold opacity-95 drop-shadow-md">
              Monitor penjualan dan stok barang secara real-time
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-xl p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-5xl font-extrabold text-gray-900 mb-1">
                {stats.total_products}
              </p>
              <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">
                Total Produk
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-amber-50 rounded-3xl shadow-xl p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-5xl font-extrabold text-gray-900 mb-1">
                {stats.low_stock}
              </p>
              <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">
                Stok Rendah
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-green-50 rounded-3xl shadow-xl p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-extrabold text-gray-900 leading-tight mb-1">
                {stats.today_orders} barang
              </p>
              <p className="text-sm text-gray-600 font-bold mb-1">
                Rp {new Intl.NumberFormat('id-ID').format(stats.today_revenue)}
              </p>
              <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">
                Pesanan Diterima Hari Ini
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-xl p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-5xl font-extrabold text-gray-900 mb-1">
                {stats.pending_orders}
              </p>
              <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">
                Pending
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pesanan Terbaru & Stok Rendah */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pesanan Terbaru */}
        <RecentOrders
          recentOrders={recentOrders}
          formatDate={formatDate}
          deleteOrder={deleteOrder}
        />

        {/* Produk Stok Rendah */}
        <LowStockProducts lowStockProducts={lowStockProducts} />
      </div>
    </div>
  )
}

function StatCard({ value, label, color }) {
  const colorClasses = {
    blue: 'from-white to-blue-50 border-blue-500',
    amber: 'from-white to-amber-50 border-amber-500',
    green: 'from-white to-green-50 border-green-500',
    purple: 'from-white to-purple-50 border-purple-500',
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-3xl shadow-xl p-6 border-l-4`}>
      <p className="text-5xl font-extrabold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">{label}</p>
    </div>
  )
}

function RecentOrders({ recentOrders, formatDate }) {
  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-6 border-b-4 border-blue-800 shadow-lg">
        <h2 className="text-2xl font-bold text-white">Pesanan Terbaru</h2>
      </div>

      {/* Daftar Pesanan */}
      <div className="max-h-[600px] overflow-y-auto">
        {recentOrders.length > 0 ? (
          recentOrders.map(order => {
            const now = new Date()
            const orderTime = new Date(order.created_at)
            const diffMs = now - orderTime
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
            const remainingHours = Math.max(0, 23 - diffHours)
            const remainingMinutes = Math.max(0, 59 - diffMinutes)

            const isPaid = order.payment_status === 'paid'

            return (
              <Link
                key={order.id}
                to={isPaid ? `/admin/paid?order_id=${order.id}` : `/admin/orders?order_id=${order.id}`}
                className={`block p-6 border-b border-gray-100 last:border-b-0 transition-all duration-200 ${
                  isPaid
                    ? 'bg-gradient-to-r from-green-50 to-white hover:from-green-100 hover:to-white cursor-pointer'
                    : 'bg-gradient-to-r from-yellow-50 to-white hover:from-yellow-100 hover:to-white cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2 flex-wrap gap-2">
                      <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg">
                        {order.order_number}
                      </span>
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                          isPaid
                            ? 'bg-green-500 text-white'
                            : 'bg-yellow-500 text-white'
                        }`}
                      >
                        {isPaid ? '✓ Lunas' : '⏳ Pending'}
                      </span>
                    </div>

                    <p className="text-lg font-bold text-gray-900 leading-snug">
                      {order.customer_name}
                    </p>
                    <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-green-600">
                      Rp {new Intl.NumberFormat('id-ID').format(order.total_amount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-medium bg-gray-100 px-2 py-1 rounded-full inline-block">
                      ⏰ Akan Hilang Dalam {remainingHours}j {remainingMinutes}m
                    </p>
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium">Tidak ada pesanan</p>
          </div>
        )}
      </div>
    </div>
  )
}


function LowStockProducts({ lowStockProducts }) {
  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-6 py-6 border-b-4 border-amber-600 shadow-lg">
        <h2 className="text-2xl font-bold text-white">Stok Rendah</h2>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {lowStockProducts.length > 0 ? (
          lowStockProducts.map(product => (
            <Link
              key={product.id}
              to={`/admin/products?product_id=${product.id}`}
              className="block p-6 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all duration-200 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-300 shadow-md flex-shrink-0 overflow-hidden">
                    {product.image ? (
                      <img
                        className="h-16 w-16 rounded-xl object-cover"
                        src={
                          product.image.startsWith('http')
                            ? product.image
                            : `https://cjyxiahyycakcuhgswat.supabase.co/storage/v1/object/public/products/${product.image}`
                        }
                        alt={product.name}
                      />
                    ) : (
                      <svg
                        className="w-8 h-8 text-gray-400"
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
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      {product.category?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold ${
                      product.stock <= 0
                        ? 'bg-red-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}
                  >
                    Stok: {product.stock}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium">
              Tidak ada produk dengan stok rendah
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
