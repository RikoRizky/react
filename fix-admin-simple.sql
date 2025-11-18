-- Simple admin creation using Supabase's built-in functions
-- This bypasses direct auth.users manipulation

-- Create function to add admin user using Supabase auth admin API
CREATE OR REPLACE FUNCTION admin_create_user(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    new_user_id UUID;
    user_data JSONB;
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
        RAISE EXCEPTION 'User with this email already exists';
    END IF;

    -- Use Supabase's admin API to create user
    SELECT auth.admin_create_user(
        user_email,
        user_password,
        json_build_object(
            'name', user_name,
            'role', 'admin'
        )::jsonb
    ) INTO user_data;

    -- Extract user ID from response
    new_user_id := (user_data->>'id')::uuid;

    -- Create user in public.users if not already created by trigger
    INSERT INTO public.users (id, email, name, role)
    VALUES (new_user_id, user_email, COALESCE(user_name, user_email), 'admin')
    ON CONFLICT (id) DO NOTHING;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION admin_create_user(TEXT, TEXT, TEXT) TO authenticated;
