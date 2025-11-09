import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  session: null,
  isAdmin: false,

  init: async () => {
    try {
      console.log('Initializing auth...')
      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Session error:', sessionError)
        set({ loading: false })
        return
      }

      const user = session?.user ?? null
      console.log('Current user:', user)

      // Check if user is admin
      let isAdmin = false
      if (user) {
        try {
          console.log('Checking admin role for user:', user.id)
          const { data: userRole, error: roleError } = await supabase
            .rpc('get_user_role', { user_id: user.id })

          if (roleError) {
            console.error('Role check error:', roleError)
          } else if (userRole === 'admin') {
            isAdmin = true
            console.log('User is admin')
          } else {
            console.log('User role:', userRole)
          }
        } catch (error) {
          console.error('Error checking admin role:', error)
        }
      }

      console.log('Setting initial state:', { user: !!user, isAdmin, loading: false })
      set({ user, session, isAdmin, loading: false })

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, !!session)
        const user = session?.user ?? null

        // Check if user is admin
        let isAdmin = false
        if (user) {
          try {
            const { data: userRole, error } = await supabase
              .rpc('get_user_role', { user_id: user.id })

            if (!error && userRole === 'admin') {
              isAdmin = true
            }
          } catch (error) {
            console.error('Error checking admin role in listener:', error)
          }
        }

        set({ user, session, isAdmin })
      })

      // Cleanup subscription on unmount (optional)
      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ loading: false })
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check if user is admin
      let isAdmin = false
      if (data.user) {
        const { data: userRole, error: roleError } = await supabase
          .rpc('get_user_role', { user_id: data.user.id })

        if (roleError || !userRole) {
          console.error('Error getting user role:', roleError)
          await supabase.auth.signOut()
          throw new Error('User data tidak ditemukan')
        }

        if (userRole !== 'admin') {
          await supabase.auth.signOut()
          throw new Error('Anda tidak memiliki akses admin')
        }

        isAdmin = userRole === 'admin'
        // Store role in user metadata for quick access
        data.user.user_metadata = { ...data.user.user_metadata, role: userRole }
      }

      set({ user: data.user, session: data.session, isAdmin })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set({ user: null, session: null, isAdmin: false })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  checkIsAdmin: async () => {
    const user = get().user
    if (!user) return false

    // Check from user metadata first (fast)
    if (user.user_metadata?.role === 'admin') {
      return true
    }

    // If not in metadata, check from database using RPC
    try {
      const { data: userRole, error } = await supabase
        .rpc('get_user_role', { user_id: user.id })

      if (error || !userRole) return false
      return userRole === 'admin'
    } catch (error) {
      return false
    }
  },
}))

export { useAuthStore }
