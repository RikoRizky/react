-- Fix RLS policy for orders table to allow anonymous inserts for checkout
-- This resolves the "new row violates row-level security policy" error

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

CREATE POLICY "Allow anonymous orders" ON public.orders
    FOR INSERT WITH CHECK (true);
