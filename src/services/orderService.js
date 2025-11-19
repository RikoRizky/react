import { supabase } from '../lib/supabase'

export const createOrder = async (orderData) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          total_amount: orderData.total_amount,
          status: 'pending',
          payment_status: 'pending',
          notes: orderData.notes,
          session_id: orderData.session_id,
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Create order items
    const orderItems = orderData.items.map((item) => ({
      order_id: data.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return { success: true, order: data }
  } catch (error) {
    console.error('Error creating order:', error)
    return { success: false, error: error.message }
  }
}

export const createOrderWithReceipt = async (orderData) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          total_amount: orderData.total_amount,
          status: 'pending',
          payment_status: 'pending',
          notes: orderData.notes,
          session_id: orderData.session_id,
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Create order items
    const orderItems = orderData.items.map((item) => ({
      order_id: data.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return { success: true, order: data }
  } catch (error) {
    console.error('Error creating order with receipt:', error)
    return { success: false, error: error.message }
  }
}



export const getOrderItems = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('*, product:products(*)')
      .eq('order_id', orderId)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching order items:', error)
    return []
  }
}

export const getOrdersBySession = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, orderItems:order_items(*, product:products(*))')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, orders: data }
  } catch (error) {
    console.error('Error fetching orders:', error)
    return { success: false, error: error.message }
  }
}

export const updateOrderPaymentStatus = async (orderNumber, status, paymentProof = null) => {
  try {
    // Get order first
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', orderNumber)
      .single()

    if (orderError) throw orderError

    const updates = {
      payment_status: status,
    }

    if (status === 'paid') {
      updates.status = 'processing'
      updates.paid_at = new Date().toISOString()

      // Add payment proof if provided
      if (paymentProof) {
        updates.payment_proof = paymentProof
      }

      // Reduce product stock
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', order.id)

      if (itemsError) throw itemsError

      // Update stock for each product
      for (const item of orderItems || []) {
        // Get current stock
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single()

        if (productError) throw productError

        // Update stock
        const newStock = Math.max(0, product.stock - item.quantity)
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id)

        if (updateError) throw updateError
      }
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('order_number', orderNumber)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error updating order status:', error)
    return { success: false, error: error.message }
  }
}

export const uploadPaymentProof = async (file) => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `payment-proof-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `payment-proofs/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('products') // Using existing bucket, could create separate bucket later
      .upload(filePath, file)

    if (uploadError) throw uploadError

    return filePath
  } catch (error) {
    console.error('Error uploading payment proof:', error)
    throw error
  }
}
