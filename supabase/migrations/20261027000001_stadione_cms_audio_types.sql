-- The illustrated-reel editor requires narration and licensed background audio.
-- Preserve bucket identity, visibility, size limit, and all previously allowed types.
update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4','audio/mpeg','audio/wav']
where id = 'stadione-cms';
