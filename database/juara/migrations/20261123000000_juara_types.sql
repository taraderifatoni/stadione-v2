-- RENCANA — JUARA MIGRATION M-00 (RENCANA, JANGAN DI-APPLY TANPA IZIN OWNER)
-- Tipe & ENUM ber-prefix juara_. Tidak ada data, tidak ada DROP/TRUNCATE.

CREATE TYPE juara_league_tier AS ENUM ('LIGA_1','LIGA_2','LIGA_3','ACADEMY_PRO');
CREATE TYPE juara_target_outcome AS ENUM ('CHAMPION','PROMOTION','TOP_4','MID_TABLE_SUSTAINABLE');
CREATE TYPE juara_tactical_dna AS ENUM ('HIGH_PRESSING','POSITIONAL_PLAY','VERTICAL_COUNTER','BALANCED_HYBRID');
CREATE TYPE juara_playbook_status AS ENUM ('DRAFT','SIMULATION','LOCKED_ACTIVE','ARCHIVED');
CREATE TYPE juara_depth_tier AS ENUM ('STARTER','BACKUP','U21_SHADOW');
CREATE TYPE juara_target_grade AS ENUM ('A','B','C');
CREATE TYPE juara_ability_grade AS ENUM ('A+','A','B+','B','C');
CREATE TYPE juara_potential_grade AS ENUM ('A+','A','B');
CREATE TYPE juara_maturity_stage AS ENUM ('PRE_PHV','CIRCA_PHV','POST_PHV','ADULT');
CREATE TYPE juara_birth_quarter AS ENUM ('Q1','Q2','Q3','Q4');
