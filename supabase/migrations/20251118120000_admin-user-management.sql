-- Migration: Admin User Management Functions
-- This migration adds functions for admin to manage other admin accounts

-- Function to delete a user (admin only)
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role
    FROM public.users
    WHERE id = auth.uid();

    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can delete users';
    END IF;

    -- Cannot delete yourself
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot delete your own account';
    END IF;

    -- Delete from users table (this will cascade to auth.users via trigger)
    DELETE FROM public.users WHERE id = target_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profile (admin only)
CREATE OR REPLACE FUNCTION admin_update_user(
    target_user_id UUID,
    new_name TEXT DEFAULT NULL,
    new_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role
    FROM public.users
    WHERE id = auth.uid();

    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can update users';
    END IF;

    -- Update users table
    UPDATE public.users
    SET
        name = COALESCE(new_name, name),
        email = COALESCE(new_email, email),
        updated_at = NOW()
    WHERE id = target_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user password (admin only) - Note: This requires special handling
-- For security, we'll create a function that generates a password reset link
CREATE OR REPLACE FUNCTION admin_reset_user_password(target_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role
    FROM public.users
    WHERE id = auth.uid();

    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can reset passwords';
    END IF;

    -- Note: In a real application, you might want to send a password reset email
    -- For now, we'll just return true to indicate the operation is allowed
    -- The frontend should handle the actual password reset

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (admins)
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reset_user_password(TEXT) TO authenticated;
