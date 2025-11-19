-- Admin management without touching RLS
-- Uses only SECURITY DEFINER functions to bypass RLS

-- Create function to add admin user using Supabase's built-in auth functions
CREATE OR REPLACE FUNCTION admin_create_user(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    user_data JSONB;
    new_user_id UUID;
BEGIN
    -- Use Supabase's admin API to create user (this handles auth.users automatically)
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

    -- Insert into public.users (this will be handled by trigger if it exists)
    INSERT INTO public.users (id, email, name, role)
    VALUES (new_user_id, user_email, COALESCE(user_name, user_email), 'admin')
    ON CONFLICT (id) DO NOTHING;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all admins
CREATE OR REPLACE FUNCTION get_all_admins()
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.name, u.email, u.role, u.created_at, u.updated_at
    FROM public.users u
    WHERE u.role = 'admin'
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update admin user
CREATE OR REPLACE FUNCTION admin_update_user_profile(
    target_user_id UUID,
    new_name TEXT DEFAULT NULL,
    new_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update public.users
    UPDATE public.users
    SET
        name = COALESCE(new_name, name),
        email = COALESCE(new_email, email),
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Update auth.users if email changed
    IF new_email IS NOT NULL THEN
        PERFORM auth.admin_update_user_by_id(
            target_user_id,
            json_build_object('email', new_email)::jsonb
        );
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to delete admin user
CREATE OR REPLACE FUNCTION admin_delete_user_account(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete from public.users first
    DELETE FROM public.users WHERE id = target_user_id;

    -- Delete from auth.users using admin function
    PERFORM auth.admin_delete_user(target_user_id);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_all_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_user(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_profile(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user_account(UUID) TO authenticated;
