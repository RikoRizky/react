import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useState } from 'react'
import toast from 'react-hot-toast'

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, user } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    const result = await signOut()
    if (result.success) {
      toast.success('Logout berhasil!')
      navigate('/')
    } else {
      toast.error(result.error || 'Logout gagal')
    }
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">
                  Admin Panel
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/admin/products"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  Produk
                </NavLink>
                <NavLink
                  to="/admin/orders"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  Pending
                </NavLink>
                <NavLink
                  to="/admin/paid"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  Lunas
                </NavLink>
              </div>
            </div>
            <div className="flex items-center">
              <span className="hidden sm:block text-sm text-gray-700 mr-4">{user?.email}</span>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>

              <button
                onClick={handleLogout}
                className="hidden sm:block bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <NavLink
              to="/admin/dashboard"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/products"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              Produk
            </NavLink>
            <NavLink
              to="/admin/orders"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              Pending
            </NavLink>
            <NavLink
              to="/admin/paid"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              Lunas
            </NavLink>
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="px-3 py-2 text-sm text-gray-500">
                {user?.email}
              </div>
              <button
                onClick={() => {
                  closeMobileMenu()
                  handleLogout()
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
