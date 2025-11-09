-- Migration to add category_id column to products table
-- Run this in Supabase SQL Editor if the column is missing

-- Add category_id column if it doesn't exist
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- Optional: Update existing products to have a default category
-- You can uncomment and modify this if you want to assign existing products to a category
-- UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE name = 'Alat Tulis' LIMIT 1) WHERE category_id IS NULL;
