import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { useEffect, useState } from 'react'
import { startOrderCleanup } from './services/orderCleanupService'

// Public Pages
import ProductList from './pages/ProductList'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderHistory from './pages/OrderHistory'


// Admin Pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProductManagement from './pages/admin/AdminProductManagement'
import AdminOrderManagement from './pages/admin/AdminOrderManagement'
import AdminPaidOrders from './pages/admin/AdminPaidOrders'

// Layouts
import Layout from './components/Layout'
import AdminLayout from './components/admin/AdminLayout'

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  const { init } = useAuthStore()

  useEffect(() => {
    init()
    // Start automatic order cleanup
    const cleanupInterval = startOrderCleanup()
    return cleanupInterval // Cleanup on unmount
  }, [init])

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/products" replace />} />
          <Route path="products" element={<ProductList />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-history" element={<OrderHistory />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProductManagement />} />
          <Route path="orders" element={<AdminOrderManagement />} />
          <Route path="paid" element={<AdminPaidOrders />} />
        </Route>


      </Routes>
    </Router>
  )
}

export default App
