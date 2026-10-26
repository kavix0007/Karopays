-- Additive KaroPays admin traffic-source review support.
-- Does not modify existing creator, file, payout, download, or earnings data.
-- Apply only after 20261026_add_traffic_sources.sql has been applied.

ALTER TABLE public.traffic_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read traffic sources" ON public.traffic_sources;
CREATE POLICY "Admins can read traffic sources"
ON public.traffic_sources FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()
));

CREATE OR REPLACE FUNCTION public.admin_review_traffic_source(p_source_id uuid, p_status text)
RETURNS public.traffic_sources
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row public.traffic_sources;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_status NOT IN ('approved','rejected') THEN
    RAISE EXCEPTION 'Status must be approved or rejected';
  END IF;

  UPDATE public.traffic_sources
  SET status = p_status,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      updated_at = now()
  WHERE id = p_source_id AND status = 'pending'
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending traffic source not found';
  END IF;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_traffic_source(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_review_traffic_source(uuid, text) TO authenticated;
