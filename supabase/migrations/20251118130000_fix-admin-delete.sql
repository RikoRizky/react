-- Fix admin delete function to properly delete from auth.users
-- This uses the correct Supabase admin function to delete users

-- Drop the old function
DROP FUNCTION IF EXISTS admin_delete_user(UUID);

-- Create new function that properly deletes from auth.users
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

    -- Delete from auth.users using admin function
    -- This will cascade to public.users via the trigger
    PERFORM auth.admin.delete_user(target_user_id);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (admins)
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;
