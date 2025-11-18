-- Fix RLS policy for order_items table to allow anonymous inserts for checkout
-- This resolves the "new row violates row-level security policy" error

DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;

CREATE POLICY "Allow anonymous order items" ON public.order_items
    FOR INSERT WITH CHECK (true);
