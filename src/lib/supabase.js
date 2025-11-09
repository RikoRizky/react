import { createClient } from '@supabase/supabase-js'

// Default Supabase credentials (akan di-override oleh .env jika ada)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cjyxiahyycakcuhgswat.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeXhpYWh5eWNha2N1aGdzd2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDE1MjIsImV4cCI6MjA3ODA3NzUyMn0.j-TvyDpgOmyF84S4aUCDur3v-rYfhvFSYsD93pp89I0'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials tidak ditemukan. Pastikan file .env sudah dibuat dengan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
