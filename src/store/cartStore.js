import { create } from 'zustand'

// Generate or get user session ID
const getUserSessionId = () => {
  let sessionId = localStorage.getItem('user_session_id')
  if (!sessionId) {
    sessionId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('user_session_id', sessionId)
  }
  return sessionId
}

// Use localStorage with user session for cart isolation
const getStoredCart = () => {
  try {
    const sessionId = getUserSessionId()
    const stored = localStorage.getItem(`cart_${sessionId}`)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

const saveCart = (items) => {
  try {
    const sessionId = getUserSessionId()
    localStorage.setItem(`cart_${sessionId}`, JSON.stringify(items))
  } catch (error) {
    console.error('Error saving cart:', error)
  }
}

const useCartStore = create((set, get) => ({
  items: getStoredCart(),

  addToCart: (product) => {
    const items = get().items
    const productId = product.id

    if (items[productId]) {
      if (items[productId].quantity >= product.stock) {
        return { success: false, error: 'Stok tidak mencukupi!' }
      }
      items[productId].quantity += 1
    } else {
      items[productId] = {
        quantity: 1,
        price: product.price,
        product_id: productId,
      }
    }

    set({ items: { ...items } })
    saveCart({ ...items })
    return { success: true }
  },

  updateQuantity: (productId, quantity, maxStock) => {
    const items = get().items

    if (quantity <= 0) {
      delete items[productId]
    } else {
      if (quantity > maxStock) {
        quantity = maxStock
      }
      if (items[productId]) {
        items[productId].quantity = quantity
      }
    }

    set({ items: { ...items } })
    saveCart({ ...items })
    return { success: true }
  },

  incrementQuantity: (productId, maxStock) => {
    const items = get().items
    if (items[productId]) {
      if (items[productId].quantity >= maxStock) {
        return { success: false, error: 'Stok tidak mencukupi!' }
      }
      items[productId].quantity += 1
      set({ items: { ...items } })
      saveCart({ ...items })
    }
    return { success: true }
  },

  decrementQuantity: (productId) => {
    const items = get().items
    if (items[productId]) {
      if (items[productId].quantity > 1) {
        items[productId].quantity -= 1
      } else {
        delete items[productId]
      }
      set({ items: { ...items } })
      saveCart({ ...items })
    }
    return { success: true }
  },

  removeFromCart: (productId) => {
    const items = get().items
    delete items[productId]
    set({ items: { ...items } })
    saveCart({ ...items })
    return { success: true }
  },

  clearCart: () => {
    set({ items: {} })
    saveCart({})
    return { success: true }
  },

  getCartQuantity: (productId) => {
    const items = get().items
    return items[productId]?.quantity || 0
  },

  getTotalQuantity: () => {
    const items = get().items
    return Object.values(items).reduce((sum, item) => sum + item.quantity, 0)
  },

  getTotalAmount: () => {
    const items = get().items
    return Object.values(items).reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    )
  },

  getCartItems: () => {
    return get().items
  },
}))

export { useCartStore }