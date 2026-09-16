-- =============================================================================
-- Admin CMS untuk recipe.20fit.id — Setup tabel role + audit log
-- Jalankan di Supabase SQL Editor (project cpvzwqptzcxnwzfzgrmt)
-- PERHATIAN: Supabase di-share dengan my.20fit.id — tabel baru saja, tidak ubah
-- struktur yang sudah ada.
-- =============================================================================

-- 1. Tabel role admin (cuma admin yang bisa akses /admin)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_admin_role (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('admin', 'superadmin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE (user_id)
);

-- RLS: hanya user yang sudah ada di tabel ini bisa SELECT (cek diri sendiri).
-- INSERT/UPDATE/DELETE hanya superadmin.
ALTER TABLE recipe_admin_role ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_can_read_own_role"
  ON recipe_admin_role FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "superadmin_can_manage_roles"
  ON recipe_admin_role FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM recipe_admin_role
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

-- 2. Tabel audit log — catat setiap aksi admin
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_admin_audit_log (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id   uuid NOT NULL REFERENCES auth.users(id),
  action     text NOT NULL,        -- 'approve', 'reject', 'edit', 'publish', 'unpublish', dll.
  target_type text NOT NULL,       -- 'recipe', 'article'
  target_id  text NOT NULL,        -- id resep/artikel
  detail     jsonb DEFAULT '{}',   -- data tambahan (alasan reject, field yang diubah, dll)
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recipe_admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Hanya admin yang bisa baca & tulis audit log.
CREATE POLICY "admin_can_read_audit"
  ON recipe_admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipe_admin_role
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "admin_can_write_audit"
  ON recipe_admin_audit_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipe_admin_role
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- 3. RLS policy untuk my20fit_menu_contribution — admin bisa baca SEMUA submission
--    (bukan cuma yang approved+published). Policy nama unik supaya tidak bentrok
--    dengan policy yang sudah ada.
-- -------------------------------------------------------
-- Cek: kalau tabel my20fit_menu_contribution ada, tambahkan policy admin read.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'my20fit_menu_contribution') THEN
    -- Policy: admin bisa SELECT semua submission (untuk review queue)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'my20fit_menu_contribution'
        AND policyname = 'recipe_admin_read_all_submissions'
    ) THEN
      EXECUTE 'CREATE POLICY "recipe_admin_read_all_submissions"
        ON my20fit_menu_contribution FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM recipe_admin_role
            WHERE user_id = auth.uid() AND role IN (''admin'', ''superadmin'')
          )
        )';
    END IF;

    -- Policy: admin bisa UPDATE submission (approve/reject/edit)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'my20fit_menu_contribution'
        AND policyname = 'recipe_admin_update_submissions'
    ) THEN
      EXECUTE 'CREATE POLICY "recipe_admin_update_submissions"
        ON my20fit_menu_contribution FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM recipe_admin_role
            WHERE user_id = auth.uid() AND role IN (''admin'', ''superadmin'')
          )
        )';
    END IF;
  END IF;
END $$;

-- 4. RLS policy untuk my20fit_recipe_article — admin bisa CRUD semua artikel
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'my20fit_recipe_article') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'my20fit_recipe_article'
        AND policyname = 'recipe_admin_manage_articles'
    ) THEN
      EXECUTE 'CREATE POLICY "recipe_admin_manage_articles"
        ON my20fit_recipe_article FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM recipe_admin_role
            WHERE user_id = auth.uid() AND role IN (''admin'', ''superadmin'')
          )
        )';
    END IF;
  END IF;
END $$;

-- 5. Buat akun admin di Supabase Dashboard
--    Buka Supabase Dashboard → Authentication → Users → "Add user" → "Create new user"
--    Centang "Auto Confirm User" supaya langsung aktif.
--
--    Akun-akun yang perlu dibuat (password dikirim terpisah, JANGAN simpan di repo):
--      nicolezoe83@gmail.com
--      tifany@20fit.id
--      zidni@20fit.id
--
--    (luthfi@20fit.id sudah ada — tidak perlu dibuat ulang)
-- -------------------------------------------------------

-- 6. Seed: tambahkan role admin
--    Jalankan SETELAH semua akun di atas sudah dibuat dan tabel di atas sudah jalan.
-- -------------------------------------------------------

-- 6a. Cari UUID semua akun admin:
--   SELECT id, email FROM auth.users
--   WHERE email IN ('luthfi@20fit.id', 'zidni@20fit.id', 'nicolezoe83@gmail.com', 'tifany@20fit.id');

-- 6b. Insert superadmin (luthfi@20fit.id):
--   INSERT INTO recipe_admin_role (user_id, role)
--   VALUES ('<UUID_LUTHFI>', 'superadmin');

-- 6c. Insert admin (sisanya):
--   INSERT INTO recipe_admin_role (user_id, role) VALUES ('<UUID_ZIDNI>', 'admin');
--   INSERT INTO recipe_admin_role (user_id, role) VALUES ('<UUID_NICOLE>', 'admin');
--   INSERT INTO recipe_admin_role (user_id, role) VALUES ('<UUID_TIFANY>', 'admin');
