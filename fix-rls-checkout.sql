-- Script untuk memperbaiki RLS agar checkout bisa dilakukan tanpa login
-- Jalankan script ini di Supabase SQL Editor

-- 1. Hapus semua policy yang ada untuk tabel orders
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anonymous orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anonymous view orders" ON public.orders;

-- 2. Buat policy baru untuk orders yang mengizinkan insert anonim
CREATE POLICY "Allow anonymous orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous view orders" ON public.orders
    FOR SELECT USING (true);

-- 3. Hapus semua policy yang ada untuk tabel order_items
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow anonymous order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow anonymous view order items" ON public.order_items;

-- 4. Buat policy baru untuk order_items yang mengizinkan insert anonim
CREATE POLICY "Allow anonymous order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous view order items" ON public.order_items
    FOR SELECT USING (true);
