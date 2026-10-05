alter table public.stadione_visual_references
  drop constraint if exists stadione_visual_references_source_platform_check;

alter table public.stadione_visual_references
  add column if not exists purpose text not null default 'NEWS_COVER',
  add column if not exists asset_bucket text,
  add column if not exists asset_path text;

alter table public.stadione_visual_references
  add constraint stadione_visual_references_purpose_check
  check (purpose in ('MATCH_RESULT', 'MEME', 'NEWS_COVER', 'STATISTICS', 'REELS'));

comment on table public.stadione_visual_references is
  'Up to five monthly visual design references supplied as HTTPS links or uploaded images; references are inspiration only, not publication rights evidence.';
