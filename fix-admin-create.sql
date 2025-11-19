-- Fix for admin user creation - proper column structure for auth.users

-- Create function to add admin user with correct auth.users structure
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

    -- Create user in auth.users with correct column structure
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        app_metadata,
        user_metadata,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at,
        is_anonymous
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, -- instance_id
        new_user_id, -- id
        'authenticated', -- aud
        'authenticated', -- role
        user_email, -- email
        crypt(user_password, gen_salt('bf')), -- encrypted_password
        NOW(), -- email_confirmed_at
        NULL, -- invited_at
        '', -- confirmation_token
        NULL, -- confirmation_sent_at
        '', -- recovery_token
        NULL, -- recovery_sent_at
        '', -- email_change_token_new
        '', -- email_change
        NULL, -- email_change_sent_at
        NULL, -- last_sign_in_at
        '{"provider": "email", "providers": ["email"]}'::jsonb, -- app_metadata
        json_build_object('name', user_name, 'role', 'admin')::jsonb, -- user_metadata
        false, -- is_super_admin
        NOW(), -- created_at
        NOW(), -- updated_at
        NULL, -- phone
        NULL, -- phone_confirmed_at
        '', -- phone_change
        '', -- phone_change_token
        NULL, -- phone_change_sent_at
        '', -- email_change_token_current
        0, -- email_change_confirm_status
        NULL, -- banned_until
        '', -- reauthentication_token
        NULL, -- reauthentication_sent_at
        false, -- is_sso_user
        NULL, -- deleted_at
        false -- is_anonymous
    );

    -- Create user in public.users
    INSERT INTO public.users (id, email, name, role)
    VALUES (new_user_id, user_email, COALESCE(user_name, user_email), 'admin');

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION admin_create_user(TEXT, TEXT, TEXT) TO authenticated;
