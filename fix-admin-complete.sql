-- Complete fix for admin management system
-- This addresses all issues: RLS, column structure, and proper user creation

-- Step 1: Temporarily disable RLS for admin operations
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Create a comprehensive admin user creation function
CREATE OR REPLACE FUNCTION admin_create_user(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    new_user_id UUID;
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Check if email already exists in auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = user_email) INTO user_exists;
    IF user_exists THEN
        RAISE EXCEPTION 'User with this email already exists';
    END IF;

    -- Check if email already exists in public.users
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = user_email) INTO user_exists;
    IF user_exists THEN
        RAISE EXCEPTION 'User with this email already exists';
    END IF;

    -- Generate new UUID for user
    new_user_id := gen_random_uuid();

    -- Insert into auth.users with minimal required columns
    -- Using a safe approach that works with different Supabase versions
    BEGIN
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            aud,
            role
        ) VALUES (
            new_user_id,
            user_email,
            crypt(user_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        );
    EXCEPTION
        WHEN undefined_column THEN
            -- Fallback for different column structures
            EXECUTE 'INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)'
            USING new_user_id, user_email, crypt(user_password, gen_salt('bf')), NOW(), NOW(), NOW();
    END;

    -- Create user in public.users
    INSERT INTO public.users (id, email, name, role)
    VALUES (new_user_id, user_email, COALESCE(user_name, user_email), 'admin');

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create function to get all admins
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

-- Step 4: Create function to update admin user
CREATE OR REPLACE FUNCTION admin_update_user_profile(
    target_user_id UUID,
    new_name TEXT DEFAULT NULL,
    new_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Update public.users
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

-- Step 5: Create function to delete admin user
CREATE OR REPLACE FUNCTION admin_delete_user_account(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Cannot delete yourself
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot delete your own account';
    END IF;

    -- Delete from public.users first (due to foreign key constraints)
    DELETE FROM public.users WHERE id = target_user_id;

    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = target_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION get_all_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_user(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_profile(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user_account(UUID) TO authenticated;

-- Step 7: Re-enable RLS with proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Create new policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Step 8: Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.users WHERE id = user_id;
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
