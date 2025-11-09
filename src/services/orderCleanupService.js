import { supabase } from '../lib/supabase'

export const cleanupExpiredOrders = async () => {
  try {
    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    // Get orders older than 24 hours that are still pending
    const { data: expiredOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id')
      .eq('payment_status', 'pending')
      .lt('created_at', twentyFourHoursAgo.toISOString())

    if (fetchError) throw fetchError

    if (expiredOrders && expiredOrders.length > 0) {
      const orderIds = expiredOrders.map(order => order.id)

      // Delete the orders (order_items will be deleted automatically due to CASCADE)
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds)

      if (ordersError) throw ordersError

      console.log(`Cleaned up ${orderIds.length} expired orders`)
      return { success: true, cleanedCount: orderIds.length }
    }

    return { success: true, cleanedCount: 0 }
  } catch (error) {
    console.error('Error cleaning up expired orders:', error)
    return { success: false, error: error.message }
  }
}

// Function to run cleanup periodically (can be called from useEffect or cron job)
export const startOrderCleanup = () => {
  // Run cleanup immediately
  cleanupExpiredOrders()

  // Set up interval to run every hour
  const intervalId = setInterval(cleanupExpiredOrders, 60 * 60 * 1000) // 1 hour

  // Return cleanup function
  return () => clearInterval(intervalId)
}
