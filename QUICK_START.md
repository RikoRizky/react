# Quick Start Guide

## Setup Cepat

### 1. Install Dependencies
```bash
cd react-app
npm install
```

### 2. Buat File .env
Buat file `.env` di folder `react-app` dengan isi:
```env
VITE_SUPABASE_URL=https://cjyxiahyycakcuhgswat.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeXhpYWh5eWNha2N1aGdzd2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDE1MjIsImV4cCI6MjA3ODA3NzUyMn0.j-TvyDpgOmyF84S4aUCDur3v-rYfhvFSYsD93pp89I0
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
VITE_MIDTRANS_SERVER_KEY=your_midtrans_server_key
VITE_MIDTRANS_IS_PRODUCTION=false
VITE_ADMIN_WHATSAPP=6281234567890
```

**Catatan:** Supabase credentials sudah di-hardcode sebagai fallback, jadi aplikasi akan tetap berjalan meskipun .env belum dibuat.

### 3. Setup Database di Supabase

1. Buka https://cjyxiahyycakcuhgswat.supabase.co
2. Login ke Supabase Dashboard
3. Buka SQL Editor
4. Copy dan jalankan seluruh isi file `supabase-schema.sql`
5. Buat Storage Bucket:
   - Nama: `products`
   - Public: Yes

### 4. Buat Admin User

1. Buka Authentication di Supabase Dashboard
2. Buat user baru (atau gunakan yang sudah ada)
3. Jalankan query SQL:
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 5. Jalankan Aplikasi
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### 6. Login sebagai Admin
- URL: `http://localhost:3000/admin/login`
- Gunakan email dan password admin yang sudah dibuat

## Struktur File Penting

- `src/lib/supabase.js` - Konfigurasi Supabase (sudah include credentials)
- `supabase-schema.sql` - Database schema untuk dijalankan di Supabase
- `src/pages/` - Semua halaman aplikasi
- `src/components/` - Komponen reusable
- `src/store/` - State management (Zustand)
- `src/services/` - API services

## Fitur yang Tersedia

✅ Product List dengan search & filter
✅ Shopping Cart
✅ Checkout dengan Midtrans
✅ Order History
✅ Admin Dashboard
✅ Admin Product Management (CRUD)
✅ Authentication dengan Supabase

## Next Steps

1. Setup Midtrans credentials di .env (jika ingin menggunakan payment)
2. Tambah produk melalui Admin Panel
3. Tambah kategori produk melalui SQL atau Admin Panel
4. Customize styling sesuai kebutuhan
