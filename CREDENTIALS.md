# Supabase Credentials

## Credentials yang sudah diterapkan:

**Supabase URL:** `https://cjyxiahyycakcuhgswat.supabase.co`

**Supabase Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeXhpYWh5eWNha2N1aGdzd2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDE1MjIsImV4cCI6MjA3ODA3NzUyMn0.j-TvyDpgOmyF84S4aUCDur3v-rYfhvFSYsD93pp89I0`

## Setup File .env

Buat file `.env` di folder `react-app` dengan isi berikut:

```env
VITE_SUPABASE_URL=https://cjyxiahyycakcuhgswat.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeXhpYWh5eWNha2N1aGdzd2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDE1MjIsImV4cCI6MjA3ODA3NzUyMn0.j-TvyDpgOmyF84S4aUCDur3v-rYfhvFSYsD93pp89I0
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
VITE_MIDTRANS_SERVER_KEY=your_midtrans_server_key
VITE_MIDTRANS_IS_PRODUCTION=false
VITE_ADMIN_WHATSAPP=6281234567890
```

**Catatan:** Credentials Supabase sudah di-hardcode sebagai fallback di `src/lib/supabase.js`, jadi aplikasi akan tetap berfungsi meskipun file .env belum dibuat. Namun, sangat disarankan untuk membuat file .env untuk keamanan yang lebih baik.
