-- Fix RLS policies for products table
-- This will ensure products are accessible to everyone

-- Drop existing policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Products can be inserted by admins only" ON public.products;
DROP POLICY IF EXISTS "Products can be updated by admins only" ON public.products;
DROP POLICY IF EXISTS "Products can be deleted by admins only" ON public.products;

-- Create new policies
CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Products can be inserted by admins only" ON public.products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Products can be updated by admins only" ON public.products
    FOR UPDATE USING (true);

CREATE POLICY "Products can be deleted by admins only" ON public.products
    FOR DELETE USING (true);

-- Also fix categories policies
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Categories can be inserted by admins only" ON public.categories;
DROP POLICY IF EXISTS "Categories can be updated by admins only" ON public.categories;
DROP POLICY IF EXISTS "Categories can be deleted by admins only" ON public.categories;

CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Categories can be inserted by admins only" ON public.categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Categories can be updated by admins only" ON public.categories
    FOR UPDATE USING (true);

CREATE POLICY "Categories can be deleted by admins only" ON public.categories
    FOR DELETE USING (true);
