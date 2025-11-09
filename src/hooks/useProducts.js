import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProducts(filters = {}) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 12,
    total: 0,
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [filters.search, filters.selectedCategory, filters.sortBy, filters.sortDirection, pagination.page])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError(error.message)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('products')
        .select('*, category:categories(*)', { count: 'exact' })
        .eq('is_active', true)

      // Apply filters
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        )
      }

      if (filters.selectedCategory) {
        query = query.eq('category_id', filters.selectedCategory)
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'name'
      const sortDirection = filters.sortDirection || 'asc'
      query = query.order(sortBy, { ascending: sortDirection === 'asc' })

      // Apply pagination
      const from = (pagination.page - 1) * pagination.perPage
      const to = from + pagination.perPage - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      setProducts(data || [])
      setPagination((prev) => ({ ...prev, total: count || 0 }))
      setError(null)
    } catch (error) {
      console.error('Error fetching products:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    products,
    categories,
    loading,
    error,
    pagination,
    refetch: fetchProducts,
    setPage: (page) => setPagination((prev) => ({ ...prev, page })),
  }
}
