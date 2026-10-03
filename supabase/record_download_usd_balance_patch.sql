-- KAROPAYS: keep creator profile balance synchronized with download earnings.
-- Safe to run once on the existing database. Does not delete existing data.

UPDATE public.profiles p
SET
  total_earnings = COALESCE(x.total_earnings, 0),
  total_downloads = COALESCE(x.total_downloads, 0),
  balance = COALESCE(x.total_earnings, 0)
FROM (
  SELECT creator_id,
         SUM(COALESCE(earnings, 0))::numeric AS total_earnings,
         SUM(COALESCE(downloads, 0))::bigint AS total_downloads
  FROM public.files
  GROUP BY creator_id
) x
WHERE p.id = x.creator_id;

CREATE OR REPLACE FUNCTION public.record_download(
  p_file_id uuid,
  p_country_code text DEFAULT 'IN'::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_creator_id uuid;
  v_ad_level integer;
  v_payout numeric;
  v_earning numeric;
  v_country text;
BEGIN
  SELECT creator_id, ad_level INTO v_creator_id, v_ad_level
  FROM public.files
  WHERE id = p_file_id AND status = 'active';

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'File not found or inactive';
  END IF;

  v_country := upper(trim(coalesce(p_country_code, 'IN')));

  SELECT payout_per_1000 INTO v_payout
  FROM public.payout_rates
  WHERE country_code = v_country AND ad_level = v_ad_level AND active = true
  LIMIT 1;

  IF v_payout IS NULL THEN
    v_country := 'IN';
    SELECT payout_per_1000 INTO v_payout
    FROM public.payout_rates
    WHERE country_code = 'IN' AND ad_level = v_ad_level AND active = true
    LIMIT 1;
  END IF;

  IF v_payout IS NULL THEN
    RAISE EXCEPTION 'No payout rate configured for country/ad level';
  END IF;

  v_earning := v_payout / 1000;

  INSERT INTO public.download_earnings
    (file_id, creator_id, country_code, ad_level, payout_rate, earning)
  VALUES
    (p_file_id, v_creator_id, v_country, v_ad_level, v_payout, v_earning);

  UPDATE public.files
  SET downloads = coalesce(downloads, 0) + 1,
      earnings = coalesce(earnings, 0) + v_earning,
      last_download_at = now()
  WHERE id = p_file_id;

  UPDATE public.profiles
  SET balance = coalesce(balance, 0) + v_earning,
      total_earnings = coalesce(total_earnings, 0) + v_earning,
      total_downloads = coalesce(total_downloads, 0) + 1
  WHERE id = v_creator_id;

  RETURN json_build_object(
    'success', true,
    'country_code', v_country,
    'ad_level', v_ad_level,
    'payout_per_1000', v_payout,
    'earning', v_earning
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.record_download(uuid, text) TO anon, authenticated;

SELECT id, balance, total_earnings, total_downloads
FROM public.profiles
ORDER BY created_at DESC;
