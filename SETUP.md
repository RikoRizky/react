# Panduan Setup Aplikasi React E-Commerce dengan Supabase

## Langkah-langkah Setup

### 1. Install Dependencies

```bash
cd react-app
npm install
```

### 2. Setup Supabase

#### a. Buat Project Supabase
1. Daftar/Buat akun di [Supabase](https://supabase.com)
2. Buat project baru
3. Tunggu hingga project selesai dibuat

#### b. Setup Database Schema
1. Buka SQL Editor di Supabase Dashboard
2. Copy seluruh isi file `supabase-schema.sql`
3. Paste dan jalankan di SQL Editor
4. Pastikan semua table dan function berhasil dibuat

#### c. Setup Storage
1. Buka Storage di Supabase Dashboard
2. Klik "Create a new bucket"
3. Nama bucket: `products`
4. Pilih "Public bucket" (centang)
5. Klik "Create bucket"

#### d. Setup Authentication
1. Buka Authentication di Supabase Dashboard
2. Klik "Add user" atau "Sign up" untuk membuat user
3. Buat user dengan email dan password
4. Setelah user dibuat, jalankan query SQL berikut untuk set role sebagai admin:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### 3. Setup Environment Variables

Buat file `.env` di folder `react-app`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
VITE_MIDTRANS_SERVER_KEY=your-midtrans-server-key
VITE_MIDTRANS_IS_PRODUCTION=false
VITE_ADMIN_WHATSAPP=6281234567890
```

**Cara mendapatkan Supabase credentials:**
- Buka Project Settings di Supabase Dashboard
- Klik "API" di menu sidebar
- Copy "Project URL" untuk `VITE_SUPABASE_URL`
- Copy "anon public" key untuk `VITE_SUPABASE_ANON_KEY`

### 4. Setup Midtrans

#### a. Daftar di Midtrans
1. Daftar/Buat akun di [Midtrans](https://midtrans.com)
2. Login ke dashboard

#### b. Dapatkan Credentials
1. Untuk Development (Sandbox):
   - Buka "Settings" > "Access Keys"
   - Copy "Server Key" untuk `VITE_MIDTRANS_SERVER_KEY`
   - Copy "Client Key" untuk `VITE_MIDTRANS_CLIENT_KEY`
   - Set `VITE_MIDTRANS_IS_PRODUCTION=false`

2. Untuk Production:
   - Setelah account diaktifkan untuk production
   - Copy Production Server Key dan Client Key
   - Set `VITE_MIDTRANS_IS_PRODUCTION=true`

### 5. Setup Data Awal (Optional)

#### a. Tambah Kategori
Jalankan query SQL berikut untuk menambahkan kategori:

```sql
INSERT INTO categories (name, description, slug, is_active) VALUES
('Alat Tulis', 'Alat tulis untuk TK', 'alat-tulis', true),
('Buku', 'Buku pembelajaran TK', 'buku', true),
('Mainan', 'Mainan edukatif TK', 'mainan', true);
```

#### b. Tambah Produk (Optional)
Anda bisa menambahkan produk melalui Admin Panel setelah login.

### 6. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### 7. Login sebagai Admin

1. Buka `http://localhost:3000/admin/login`
2. Login dengan email dan password admin yang sudah dibuat
3. Setelah login, Anda bisa mengakses:
   - Dashboard: `/admin/dashboard`
   - Kelola Produk: `/admin/products`

## Troubleshooting

### Error: Missing Supabase environment variables
- Pastikan file `.env` sudah dibuat di folder `react-app`
- Pastikan semua variabel sudah diisi dengan benar
- Restart development server setelah mengubah `.env`

### Error: Unauthorized saat akses admin
- Pastikan user sudah dibuat di Supabase Auth
- Pastikan role user sudah di-set sebagai 'admin' di database
- Pastikan RLS policies sudah di-setup dengan benar

### Error: Failed to load Midtrans script
- Pastikan `VITE_MIDTRANS_CLIENT_KEY` sudah di-set
- Pastikan koneksi internet stabil
- Check browser console untuk error detail

### Error: Storage bucket not found
- Pastikan bucket `products` sudah dibuat di Supabase Storage
- Pastikan bucket sudah di-set sebagai public
- Pastikan nama bucket tepat: `products`

### Error: RLS policy violation
- Pastikan semua RLS policies sudah di-setup dengan benar di SQL schema
- Pastikan user sudah login untuk mengakses data yang memerlukan auth
- Check Supabase logs untuk detail error

## Production Deployment

### Build untuk Production

```bash
npm run build
```

Build files akan berada di folder `dist/`

### Deploy ke Vercel/Netlify

1. Push code ke GitHub
2. Connect repository ke Vercel/Netlify
3. Set environment variables di dashboard Vercel/Netlify
4. Deploy

### Environment Variables untuk Production

Pastikan semua environment variables sudah di-set di hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MIDTRANS_CLIENT_KEY`
- `VITE_MIDTRANS_SERVER_KEY`
- `VITE_MIDTRANS_IS_PRODUCTION=true`
- `VITE_ADMIN_WHATSAPP`

## Catatan Penting

1. **Security**: Jangan commit file `.env` ke repository
2. **RLS**: Pastikan Row Level Security sudah di-setup dengan benar
3. **Storage**: Pastikan bucket `products` sudah dibuat dan public
4. **Midtrans**: Untuk production, pastikan menggunakan production credentials
5. **Admin Access**: Pastikan hanya user dengan role 'admin' yang bisa akses admin panel

## Support

Jika mengalami masalah, silakan:
1. Check error di browser console
2. Check Supabase logs
3. Check documentation Supabase dan Midtrans
4. Pastikan semua setup sudah dilakukan dengan benar
