
DROP FUNCTION IF EXISTS public.get_marketplace_services(uuid, uuid, uuid, text, text, numeric, numeric, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_marketplace_services(
  p_category uuid DEFAULT NULL,
  p_region uuid DEFAULT NULL,
  p_city uuid DEFAULT NULL,
  p_service_type text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_price_min numeric DEFAULT NULL,
  p_price_max numeric DEFAULT NULL,
  p_sort text DEFAULT 'newest',
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price numeric,
  image_url text,
  service_type service_type,
  service_number text,
  display_order integer,
  created_at timestamptz,
  provider_id uuid,
  category_id uuid,
  region_id uuid,
  city_id uuid,
  is_featured boolean,
  sales_count integer,
  service_views integer,
  category_name text,
  category_image_url text,
  region_name text,
  city_name text,
  provider_name text,
  avg_rating numeric,
  rating_count integer,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH provider_ratings AS (
    SELECT
      c.provider_id,
      AVG((r.quality_score + r.timing_score + r.communication_score) / 3.0) AS avg_rating,
      COUNT(*)::int AS rating_count
    FROM ratings r
    JOIN contracts c ON c.id = r.contract_id
    WHERE r.deleted_at IS NULL
    GROUP BY c.provider_id
  ),
  filtered AS (
    SELECT
      ms.id, ms.title, ms.description, ms.price, ms.image_url, ms.service_type,
      ms.service_number, ms.display_order, ms.created_at, ms.provider_id,
      ms.category_id, ms.region_id, ms.city_id, ms.is_featured,
      ms.sales_count, ms.service_views,
      cat.name AS category_name,
      cat.image_url AS category_image_url,
      reg.name AS region_name,
      cit.name AS city_name,
      p.full_name AS provider_name,
      COALESCE(pr.avg_rating, 0) AS avg_rating,
      COALESCE(pr.rating_count, 0) AS rating_count
    FROM micro_services ms
    LEFT JOIN categories cat ON cat.id = ms.category_id
    LEFT JOIN regions reg ON reg.id = ms.region_id
    LEFT JOIN cities cit ON cit.id = ms.city_id
    LEFT JOIN profiles p ON p.id = ms.provider_id
    LEFT JOIN provider_ratings pr ON pr.provider_id = ms.provider_id
    WHERE ms.approval = 'approved'::approval_status
      AND ms.deleted_at IS NULL
      AND (p_category IS NULL OR ms.category_id = p_category)
      AND (p_region IS NULL OR ms.region_id = p_region)
      AND (p_city IS NULL OR ms.city_id = p_city)
      AND (p_service_type IS NULL OR ms.service_type::text = p_service_type)
      AND (
        p_search IS NULL OR btrim(p_search) = '' OR
        ms.title ILIKE '%' || p_search || '%' OR
        ms.description ILIKE '%' || p_search || '%'
      )
      AND (p_price_min IS NULL OR ms.price >= p_price_min)
      AND (p_price_max IS NULL OR ms.price <= p_price_max)
  ),
  counted AS (
    SELECT f.*, COUNT(*) OVER () AS total_count FROM filtered f
  )
  SELECT
    c.id, c.title, c.description, c.price, c.image_url, c.service_type,
    c.service_number, c.display_order, c.created_at, c.provider_id,
    c.category_id, c.region_id, c.city_id, c.is_featured,
    c.sales_count, c.service_views,
    c.category_name, c.category_image_url, c.region_name, c.city_name, c.provider_name,
    c.avg_rating, c.rating_count, c.total_count
  FROM counted c
  ORDER BY
    CASE WHEN p_sort = 'price_asc'  THEN c.price END ASC NULLS LAST,
    CASE WHEN p_sort = 'price_desc' THEN c.price END DESC NULLS LAST,
    CASE WHEN p_sort = 'rating'     THEN c.avg_rating END DESC NULLS LAST,
    CASE WHEN p_sort = 'rating'     THEN c.rating_count END DESC NULLS LAST,
    CASE WHEN p_sort = 'newest'     THEN c.display_order END ASC NULLS LAST,
    c.created_at DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_services(uuid, uuid, uuid, text, text, numeric, numeric, text, integer, integer) TO anon, authenticated;
