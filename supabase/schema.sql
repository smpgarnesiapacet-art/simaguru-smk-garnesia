-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor -> New Query

CREATE TABLE IF NOT EXISTS public.simaguru_workspaces (
  id TEXT PRIMARY KEY,
  school_name TEXT NOT NULL DEFAULT 'SMK Garnesia',
  teacher_name TEXT NOT NULL DEFAULT 'Wendi Supriadi',
  tahun_ajaran TEXT NOT NULL DEFAULT '2026/2027',
  semester TEXT NOT NULL DEFAULT 'Ganjil',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks untuk pencarian metadata sekolah/guru
CREATE INDEX IF NOT EXISTS idx_simaguru_workspaces_school
  ON public.simaguru_workspaces (school_name, teacher_name);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.simaguru_workspaces ENABLE ROW LEVEL SECURITY;

-- Kebijakan akses workspace untuk aplikasi web SIMAGURU
-- Catatan: Untuk penggunaan multi-akun ketat di produksi, aktifkan Supabase Auth
-- dan ganti kebijakan ini menggunakan auth.uid().
DROP POLICY IF EXISTS "Allow workspace read access" ON public.simaguru_workspaces;
CREATE POLICY "Allow workspace read access"
  ON public.simaguru_workspaces
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow workspace insert access" ON public.simaguru_workspaces;
CREATE POLICY "Allow workspace insert access"
  ON public.simaguru_workspaces
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow workspace update access" ON public.simaguru_workspaces;
CREATE POLICY "Allow workspace update access"
  ON public.simaguru_workspaces
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
