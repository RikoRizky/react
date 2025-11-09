# E-Commerce React dengan Supabase

Aplikasi e-commerce yang dikonversi dari Laravel Livewire ke ReactJS dengan menggunakan Supabase sebagai database.

## Fitur

- ✅ Product List dengan search, filter, dan sorting
- ✅ Shopping Cart dengan localStorage
- ✅ Checkout dengan Midtrans Payment Gateway
- ✅ Order History
- ✅ Admin Dashboard dengan statistik
- ✅ Admin Product Management (CRUD)
- ✅ Authentication dengan Supabase Auth
- ✅ Real-time updates dengan Supabase

## Teknologi yang Digunakan

- **React 18** - UI Framework
- **React Router** - Routing
- **Supabase** - Database & Authentication
- **Zustand** - State Management
- **Tailwind CSS** - Styling
- **Vite** - Build Tool
- **Midtrans** - Payment Gateway
- **Axios** - HTTP Client

## Setup Awal

### 1. Clone Repository

```bash
cd react-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com)
2. Buka SQL Editor di Supabase Dashboard
3. Jalankan script SQL dari file `supabase-schema.sql`
4. Copy Project URL dan Anon Key dari Supabase Dashboard

### 4. Setup Environment Variables

**Catatan:** Supabase credentials sudah di-hardcode sebagai fallback di `src/lib/supabase.js`, jadi aplikasi akan tetap berfungsi tanpa file .env. Namun, sangat disarankan untuk membuat file .env.

Buat file `.env` di root folder `react-app`:

```env
VITE_SUPABASE_URL=https://cjyxiahyycakcuhgswat.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeXhpYWh5eWNha2N1aGdzd2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDE1MjIsImV4cCI6MjA3ODA3NzUyMn0.j-TvyDpgOmyF84S4aUCDur3v-rYfhvFSYsD93pp89I0
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
VITE_MIDTRANS_SERVER_KEY=your_midtrans_server_key
VITE_MIDTRANS_IS_PRODUCTION=false
VITE_ADMIN_WHATSAPP=6281234567890
```

**Supabase credentials yang sudah diterapkan:**
- URL: `https://cjyxiahyycakcuhgswat.supabase.co`
- Anon Key sudah di-hardcode di `src/lib/supabase.js`

### 5. Setup Midtrans

1. Daftar di [Midtrans](https://midtrans.com)
2. Dapatkan Client Key dan Server Key dari dashboard
3. Untuk development, gunakan Sandbox mode (`VITE_MIDTRANS_IS_PRODUCTION=false`)

### 6. Setup Storage di Supabase

1. Buka Storage di Supabase Dashboard
2. Buat bucket baru dengan nama `products`
3. Set bucket sebagai public
4. Upload gambar produk ke bucket ini

### 7. Buat Admin User

1. Buka Authentication di Supabase Dashboard
2. Buat user baru dengan email dan password
3. Jalankan query SQL untuk set role sebagai admin:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';
```

### 8. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## Struktur Folder

```
react-app/
├── src/
│   ├── components/          # Komponen reusable
│   │   ├── Layout.jsx       # Layout utama
│   │   └── admin/           # Komponen admin
│   ├── pages/               # Halaman aplikasi
│   │   ├── ProductList.jsx
│   │   ├── Cart.jsx
│   │   ├── Checkout.jsx
│   │   ├── OrderHistory.jsx
│   │   └── admin/           # Halaman admin
│   ├── services/            # API services
│   │   └── orderService.js
│   ├── store/               # State management
│   │   ├── authStore.js
│   │   └── cartStore.js
│   ├── hooks/               # Custom hooks
│   │   └── useProducts.js
│   ├── lib/                 # Library configuration
│   │   └── supabase.js
│   └── App.jsx              # Root component
├── supabase-schema.sql      # Database schema
└── package.json
```

## Perbedaan dengan Laravel Version

### Database
- **Laravel**: MySQL/PostgreSQL dengan Eloquent ORM
- **React**: Supabase (PostgreSQL) dengan REST API

### Authentication
- **Laravel**: Session-based dengan Laravel Sanctum
- **React**: Supabase Auth dengan JWT tokens

### State Management
- **Laravel**: Server-side state dengan Livewire
- **React**: Client-side state dengan Zustand + localStorage

### Cart Storage
- **Laravel**: Session storage
- **React**: localStorage

### Payment Gateway
- **Laravel**: Midtrans dengan server-side callback
- **React**: Midtrans Snap dengan client-side integration

## Catatan Penting

1. **Storage**: Pastikan bucket `products` di Supabase sudah dibuat dan diset sebagai public
2. **RLS Policies**: Pastikan Row Level Security policies sudah di-setup dengan benar
3. **Midtrans**: Untuk production, pastikan menggunakan production credentials
4. **Environment Variables**: Jangan commit file `.env` ke repository

## Troubleshooting

### Error: Missing Supabase environment variables
- Pastikan file `.env` sudah dibuat dan berisi semua variabel yang diperlukan

### Error: Unauthorized
- Pastikan RLS policies sudah di-setup dengan benar
- Pastikan user sudah login dengan akun admin untuk mengakses halaman admin

### Error: Failed to load Midtrans script
- Pastikan `VITE_MIDTRANS_CLIENT_KEY` sudah di-set dengan benar
- Pastikan koneksi internet stabil

## Production Build

```bash
npm run build
```

Build files akan berada di folder `dist/`

## License

MIT
