-- Simple working admin management without touching auth.users
-- Only manages public.users table

-- Temporarily disable RLS for users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

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

-- Create function to add admin user (only to public.users)
CREATE OR REPLACE FUNCTION admin_create_user(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Generate UUID
    new_user_id := gen_random_uuid();

    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM public.users WHERE email = user_email) THEN
        RAISE EXCEPTION 'Email already exists';
    END IF;

    -- Insert into public.users only
    INSERT INTO public.users (
        id,
        name,
        email,
        role,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        COALESCE(user_name, user_email),
        user_email,
        'admin',
        NOW(),
        NOW()
    );

    RETURN TRUE;
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
    -- Check if new email already exists (if changing)
    IF new_email IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.users WHERE email = new_email AND id != target_user_id) THEN
            RAISE EXCEPTION 'Email already exists';
        END IF;
    END IF;

    -- Update public.users
    UPDATE public.users
    SET
        name = COALESCE(new_name, name),
        email = COALESCE(new_email, email),
        updated_at = NOW()
    WHERE id = target_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to delete admin user
CREATE OR REPLACE FUNCTION admin_delete_user_account(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete from public.users only
    DELETE FROM public.users WHERE id = target_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_all_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_user(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_profile(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user_account(UUID) TO authenticated;
