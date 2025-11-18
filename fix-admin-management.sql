-- Complete fix for admin management system
-- This includes proper user creation, role checking, and deletion

-- 1. Fix the admin_delete_user function
DROP FUNCTION IF EXISTS admin_delete_user(UUID);

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

-- 2. Fix the admin_add_user function (for proper user creation)
CREATE OR REPLACE FUNCTION admin_add_user(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role TEXT;
    new_user_id UUID;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role
    FROM public.users
    WHERE id = auth.uid();

    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can add users';
    END IF;

    -- Create user in auth.users
    SELECT id INTO new_user_id
    FROM auth.users
    WHERE email = user_email;

    IF new_user_id IS NULL THEN
        -- User doesn't exist, create them
        INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
        VALUES (
            user_email,
            crypt(user_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            json_build_object('name', user_name, 'role', 'admin')::jsonb
        )
        RETURNING id INTO new_user_id;
    END IF;

    -- Ensure user exists in public.users
    INSERT INTO public.users (id, email, name, role)
    VALUES (new_user_id, user_email, COALESCE(user_name, user_email), 'admin')
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        role = 'admin',
        updated_at = NOW();

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix the admin_update_user function
DROP FUNCTION IF EXISTS admin_update_user(UUID, TEXT, TEXT);

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

    -- Update public.users table
    UPDATE public.users
    SET
        name = COALESCE(new_name, name),
        email = COALESCE(new_email, email),
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Update auth.users if email changed
    IF new_email IS NOT NULL THEN
        UPDATE auth.users
        SET
            email = new_email,
            updated_at = NOW()
        WHERE id = target_user_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_add_user(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user(UUID, TEXT, TEXT) TO authenticated;

-- 5. Ensure RLS policies allow admin operations
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );
