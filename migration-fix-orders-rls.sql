-- Fix RLS policy for orders table to explicitly allow anonymous and authenticated inserts
-- This resolves the "new row violates row-level security policy" error during checkout

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');
