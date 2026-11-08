import { managementClient } from "./supabase-management.mjs";

// Remove retired fields only; preserve all administrator copy and project media.
const { query } = managementClient();
const rows = await query(`
  update public.portfolio_content
  set content = jsonb_set(
    content #- '{hero,image}' #- '{about,image}' #- '{contact,image}',
    '{cinematic}',
    jsonb_build_object('crtReel', jsonb_build_object(
      'caption', coalesce(content #> '{cinematic,crtReel,caption}', '"One architecture, four systems"'::jsonb)
    ))
  ), version = version + 1, updated_at = now()
  where id in ('draft', 'published') and (
    content #> '{hero,image}' is not null or
    content #> '{about,image}' is not null or
    content #> '{contact,image}' is not null or
    content #> '{cinematic,chapterWork}' is not null or
    content #> '{cinematic,crtReel,src}' is not null
  )
  returning id;
`);
console.log("Retired media fields from:", rows.map((r) => r.id).join(", ") || "already clean");
const verification = await query(`
  select id,
    (content::text like '%/media/portrait/%' or content::text like '%/media/video/%') as has_legacy_media
  from public.portfolio_content where id in ('draft', 'published')
`);
if (verification.some((row) => row.has_legacy_media)) throw new Error("Legacy media references remain; inspect before removing any more content.");
console.log("Verified both content rows contain no retired media references.");
