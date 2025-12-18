-- MIGRATION: Fix infinite recursion in RLS policies for players table
-- Execute this SQL in Supabase SQL Editor to fix the "infinite recursion detected" error
-- Date: 2025-12-17

-- Step 1: Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their own player data" ON players;
DROP POLICY IF EXISTS "Users can update their own player data" ON players;
DROP POLICY IF EXISTS "Users can insert their own player data" ON players;
DROP POLICY IF EXISTS "Admins can view all player data" ON players;
DROP POLICY IF EXISTS "Admins can update all player data" ON players;
DROP POLICY IF EXISTS "Admins can delete player data" ON players;

-- Step 2: Create non-recursive policies for regular users
-- Users can view their own data (no recursion)
CREATE POLICY "Users can view their own player data"
    ON players FOR SELECT
    USING (auth._id() = _id);

-- Users can update their own data (no recursion, role protection via trigger)
CREATE POLICY "Users can update their own player data"
    ON players FOR UPDATE
    USING (auth._id() = _id)
    WITH CHECK (auth._id() = _id);

-- Users can insert their own data (only as 'player' role, no recursion)
CREATE POLICY "Users can insert their own player data"
    ON players FOR INSERT
    WITH CHECK (auth._id() = _id AND role = 'player');

-- Step 3: Create admin policies using email from JWT (no recursion)
-- Admin email check - replace with your admin email if different
CREATE POLICY "Admins can view all player data"
    ON players FOR SELECT
    USING ((auth.jwt() ->> 'email') = 'bryan.drouet24@gmail.com');

CREATE POLICY "Admins can update all player data"
    ON players FOR UPDATE
    USING ((auth.jwt() ->> 'email') = 'bryan.drouet24@gmail.com');

CREATE POLICY "Admins can delete player data"
    ON players FOR DELETE
    USING ((auth.jwt() ->> 'email') = 'bryan.drouet24@gmail.com');

-- Step 4: Create helper function for admin check (non-recursive)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN (auth.jwt() ->> 'email') = 'bryan.drouet24@gmail.com';
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 5: Create trigger to prevent role changes by non-admins
DROP TRIGGER IF EXISTS prevent_role_change_unless_admin ON players;

CREATE OR REPLACE FUNCTION prevent_role_change_unless_admin()
RETURNS trigger AS $$
BEGIN
    -- Allow role changes only if user is admin
    IF (NEW.role <> OLD.role) AND NOT is_admin() THEN
        RAISE EXCEPTION 'Seul un administrateur peut modifier le rôle';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_role_change_unless_admin
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION prevent_role_change_unless_admin();

-- Step 6: Verify policies
DO $$
BEGIN
    RAISE NOTICE 'Migration terminée avec succès!';
    RAISE NOTICE 'Politiques RLS non-récursives créées pour la table players';
    RAISE NOTICE 'Protection du rôle activée via trigger';
END $$;
