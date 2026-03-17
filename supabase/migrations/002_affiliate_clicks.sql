-- Affiliate / click-through revenue analytics.
-- Only the backend (service_role) inserts and reads; no RLS policies for anon/authenticated.

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  source text NOT NULL,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created_at ON public.affiliate_clicks (created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_source ON public.affiliate_clicks (source);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_event_id ON public.affiliate_clicks (event_id);

COMMENT ON TABLE public.affiliate_clicks IS 'Tracks outbound clicks to affiliate booking URLs for revenue attribution.';

-- RLS: only service role (backend) can access; no policies for anon/authenticated.
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
