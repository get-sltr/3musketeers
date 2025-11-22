-- Geo proximity helper and RPC for nearby profiles
-- Generated on 2025-11-11 to support server-side map filtering

-- Utility: calculate Haversine distance in miles between two lat/lng pairs
create or replace function public.haversine_miles(
  p_lat1 double precision,
  p_lon1 double precision,
  p_lat2 double precision,
  p_lon2 double precision
)
returns double precision
language sql
immutable
returns null on null input
as $function$
  select
    3959 * 2 * asin(
      sqrt(
        pow(sin(radians(($3 - $1) / 2)), 2) +
        cos(radians($1)) * cos(radians($3)) *
        pow(sin(radians(($4 - $2) / 2)), 2)
      )
    );
$function$;

comment on function public.haversine_miles is
  'Haversine distance in miles between two latitude/longitude points';

-- Supporting index for geo lookups (if not already created)
create index if not exists idx_profiles_lat_lon
  on public.profiles (latitude, longitude);

-- RPC: fetch profiles within a radius of the supplied origin
create or replace function public.get_nearby_profiles(
  p_user_id uuid,
  p_origin_lat double precision,
  p_origin_lon double precision,
  p_radius_miles double precision default 25
)
returns table (
  id uuid,
  display_name text,
  photo_url text,
  photos text[],
  is_online boolean,
  dtfn boolean,
  party_friendly boolean,
  latitude double precision,
  longitude double precision,
  founder_number integer,
  about text,
  kinks text[],
  tags text[],
  "position" text,
  age integer,
  incognito_mode boolean,
  distance_miles double precision,
  is_self boolean
)
language sql
stable
security definer
set search_path = public
as $function$
  with origin as (
    select p_origin_lat as lat, p_origin_lon as lon, coalesce(nullif(p_radius_miles, 0), 1)::double precision as radius
  )
  select
    prof.id,
    prof.display_name,
    prof.photo_url,
    CASE
      WHEN jsonb_typeof(prof.photos) = 'array'
      THEN (SELECT array_agg(value::text) FROM jsonb_array_elements_text(prof.photos))
      ELSE ARRAY[]::text[]
    END as photos,
    prof.online AS is_online,
    prof.dtfn,
    prof.party_friendly,
    prof.latitude,
    prof.longitude,
    prof.founder_number,
    prof.about,
    prof.kinks,
    prof.tags,
    prof."position",
    prof.age,
    prof.incognito_mode,
    public.haversine_miles(origin.lat, origin.lon, prof.latitude, prof.longitude) as distance_miles,
    prof.id = p_user_id as is_self
  from public.profiles prof
  cross join origin
  left join public.blocked_users bu
    on bu.user_id = p_user_id
   and bu.blocked_user_id = prof.id
  where prof.latitude is not null
    and prof.longitude is not null
    and coalesce(prof.incognito_mode, false) = false
    and (bu.blocked_user_id is null)
    and (
      prof.id = p_user_id
      or public.haversine_miles(origin.lat, origin.lon, prof.latitude, prof.longitude) <= origin.radius
    )
  order by
    case when prof.id = p_user_id then 0 else 1 end,
    public.haversine_miles(origin.lat, origin.lon, prof.latitude, prof.longitude)
  limit 500;
$function$;

comment on function public.get_nearby_profiles is
  'Return profiles (excluding blocked/incognito) within the specified radius of the origin coordinates, including distance in miles.';

-- Grant execute permissions to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_nearby_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nearby_profiles TO anon;
GRANT EXECUTE ON FUNCTION public.haversine_miles TO authenticated;
GRANT EXECUTE ON FUNCTION public.haversine_miles TO anon;

