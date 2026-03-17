-- Enable Row Level Security on all user-data tables.
-- Even though our server uses the service_role key (which bypasses RLS),
-- having these policies defined is defense-in-depth: they protect against
-- accidental use of the anon key and document our access patterns.

-- ─── Users ───────────────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Service role can do everything; anon/authenticated can only read their own row
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  USING (firebase_uid = auth.uid()::text);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (firebase_uid = auth.uid()::text);

-- ─── Favorites ───────────────────────────────────────────────────────────────

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites"
  ON public.favorites
  FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can insert own favorites"
  ON public.favorites
  FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can delete own favorites"
  ON public.favorites
  FOR DELETE
  USING (user_id IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text));

-- ─── User Preferences ───────────────────────────────────────────────────────

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can upsert own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (user_id IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text));
