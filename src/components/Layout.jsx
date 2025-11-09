import { Outlet, Link, useLocation } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useEffect, useState } from 'react'

function Layout() {
  const { getTotalQuantity } = useCartStore()
  const [cartCount, setCartCount] = useState(0)
  const location = useLocation()

  useEffect(() => {
    setCartCount(getTotalQuantity())
    // Listen for storage changes (cart updates)
    const handleStorageChange = () => {
      setCartCount(getTotalQuantity())
    }
    window.addEventListener('storage', handleStorageChange)
    // Also check periodically for same-tab updates
    const interval = setInterval(() => {
      setCartCount(getTotalQuantity())
    }, 500)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [getTotalQuantity, location])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b">
        <nav className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/products" className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white font-bold">
                TK
              </span>
              <span className="text-lg font-semibold text-gray-900">
                Aplikasi Pembelian
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                to="/products"
                className={`text-sm font-medium flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === '/products'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Produk
              </Link>
              <Link
                to="/order-history"
                className={`text-sm font-medium flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === '/order-history'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
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
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Riwayat
              </Link>
              <Link
                to="/cart"
                className={`text-sm font-medium flex items-center gap-1 px-3 py-2 rounded-lg transition-colors relative ${
                  location.pathname === '/cart'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Keranjang
                {cartCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Aplikasi Pembelian Guru TK
        </div>
      </footer>
    </div>
  )
}

export default Layout
