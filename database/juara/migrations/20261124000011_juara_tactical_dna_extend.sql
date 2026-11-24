-- JUARA MIGRATION M-11 (diterapkan 2026-11-24 dengan izin Owner)
-- Selaraskan ENUM database dengan 10 preset gaya bermain yang dipakai wizard.
-- ADD VALUE bersifat aditif; nilai lama tetap berlaku.

ALTER TYPE juara_tactical_dna ADD VALUE IF NOT EXISTS 'TOTAL_FOOTBALL';
ALTER TYPE juara_tactical_dna ADD VALUE IF NOT EXISTS 'CATENACCIO';
ALTER TYPE juara_tactical_dna ADD VALUE IF NOT EXISTS 'WING_PLAY';
ALTER TYPE juara_tactical_dna ADD VALUE IF NOT EXISTS 'DIAMOND_MIDFIELD';
ALTER TYPE juara_tactical_dna ADD VALUE IF NOT EXISTS 'FALSE_NINE';
ALTER TYPE juara_tactical_dna ADD VALUE IF NOT EXISTS 'DIRECT_PHYSICAL';
