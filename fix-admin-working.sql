-- Working admin user creation using direct table manipulation with correct approach

-- First, let's check what columns exist in auth.users
DO $$
DECLARE
    col_name TEXT;
BEGIN
    FOR col_name IN
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'auth' AND table_name = 'users'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: %', col_name;
    END LOOP;
END $$;

-- Create function to add admin user with minimal required columns
CREATE OR REPLACE FUNCTION admin_create_user(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    new_user_id UUID;
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

    -- Generate new UUID for user
    new_user_id := gen_random_uuid();

    -- Insert into auth.users with only the columns that exist
    -- Using dynamic SQL to handle different column structures
    EXECUTE format('
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data
        ) VALUES (
            %L::uuid,
            %L::uuid,
            %L,
            %L,
            %L,
            crypt(%L, gen_salt(%L)),
            NOW(),
            NOW(),
            NOW(),
            %L::jsonb,
            %L::jsonb
        )',
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        user_email,
        user_password,
        'bf',
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        json_build_object('name', user_name, 'role', 'admin')::jsonb
    );

    -- Create user in public.users
    INSERT INTO public.users (id, email, name, role)
    VALUES (new_user_id, user_email, COALESCE(user_name, user_email), 'admin');

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION admin_create_user(TEXT, TEXT, TEXT) TO authenticated;
