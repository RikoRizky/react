-- Debug query to check products in database
SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    p.stock,
    p.image,
    p.sku,
    p.category_id,
    p.is_active,
    p.created_at,
    c.name as category_name
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
ORDER BY p.created_at DESC;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'products' AND schemaname = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'products' AND schemaname = 'public';

-- Check categories
SELECT id, name, slug, is_active FROM public.categories WHERE is_active = true;
