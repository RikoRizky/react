-- Fix checkout RLS policies to allow order creation without authentication

-- Disable RLS for orders and order_items to allow guest checkout
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS for users table only (keep admin policies)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
