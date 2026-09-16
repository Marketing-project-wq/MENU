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

-- CATATAN (2026-09-16): policy "superadmin_can_manage_roles" SENGAJA DIHAPUS.
-- Versi lama men-query recipe_admin_role DARI DALAM policy recipe_admin_role itu
-- sendiri -> Postgres menolak dengan "infinite recursion detected in policy for
-- relation recipe_admin_role" (SQLSTATE 42P17). Efeknya SEMUA pembacaan tabel ini
-- lewat RLS gagal (termasuk self-read admin_can_read_own_role), sehingga /admin
-- selalu "Akses Ditolak" walau datanya benar superadmin.
--
-- Policy ini TIDAK diperlukan: manajemen admin (tambah/ubah/hapus role) dilakukan
-- lewat RPC SECURITY DEFINER di bawah (list/create/update/remove_recipe_admin) yang
-- bypass RLS + cek superadmin di dalam fungsi. Untuk gerbang /admin cukup self-read
-- (admin_can_read_own_role) saja.
--
-- Kalau suatu saat perlu manajemen LANGSUNG ke tabel via RLS, JANGAN query tabel
-- yang sama di dalam policy-nya. Pakai helper SECURITY DEFINER, mis:
--   CREATE FUNCTION public.is_recipe_superadmin() RETURNS boolean
--     LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
--     SELECT EXISTS (SELECT 1 FROM recipe_admin_role
--                    WHERE user_id = auth.uid() AND role = 'superadmin') $$;
--   CREATE POLICY ... USING (public.is_recipe_superadmin());
-- Fungsi SECURITY DEFINER memutus rantai rekursi RLS.

-- 1b. Kolom "wajib ganti password saat login pertama" + RPC clear flag
-- -------------------------------------------------------
-- Dipakai gerbang ForceChangePassword di /admin: akun yang dibuat/di-reset dengan
-- password SEMENTARA ditandai must_change_password=true, dan WAJIB set password baru
-- sebelum bisa masuk CMS. useAdmin() membaca kolom ini (self-read via policy di atas).
ALTER TABLE recipe_admin_role
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- RPC: admin mematikan flag-nya sendiri setelah berhasil set password baru.
-- SECURITY DEFINER + hanya untuk auth.uid() sendiri (tak bisa clear punya orang lain).
CREATE OR REPLACE FUNCTION clear_recipe_admin_must_change()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE recipe_admin_role
  SET must_change_password = false
  WHERE user_id = auth.uid();
END; $$;
REVOKE EXECUTE ON FUNCTION clear_recipe_admin_must_change() FROM public, anon;
GRANT EXECUTE ON FUNCTION clear_recipe_admin_must_change() TO authenticated;

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

-- 5. RPC: list semua admin (join recipe_admin_role + auth.users)
--    Dipanggil dari CMS oleh superadmin untuk lihat daftar admin.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION list_recipe_admins()
RETURNS TABLE (
  user_id uuid,
  email   text,
  role    text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.user_id,
    u.email,
    r.role,
    r.created_at
  FROM recipe_admin_role r
  JOIN auth.users u ON u.id = r.user_id
  ORDER BY r.created_at ASC;
$$;

-- Hanya superadmin boleh panggil
REVOKE EXECUTE ON FUNCTION list_recipe_admins() FROM public;
REVOKE EXECUTE ON FUNCTION list_recipe_admins() FROM anon;
REVOKE EXECUTE ON FUNCTION list_recipe_admins() FROM authenticated;
-- Grant ke authenticated, tapi cek role di dalam function sudah cukup
-- karena SECURITY DEFINER. Kita tambahkan guard:
CREATE OR REPLACE FUNCTION list_recipe_admins()
RETURNS TABLE (
  user_id uuid,
  email   text,
  role    text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM recipe_admin_role
    WHERE recipe_admin_role.user_id = auth.uid() AND recipe_admin_role.role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: superadmin only';
  END IF;

  RETURN QUERY
    SELECT
      r.user_id,
      u.email,
      r.role,
      r.created_at
    FROM recipe_admin_role r
    JOIN auth.users u ON u.id = r.user_id
    ORDER BY r.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION list_recipe_admins() TO authenticated;

-- 6. RPC: buat akun admin baru (create user + assign role)
--    SECURITY DEFINER supaya bisa INSERT ke auth.users.
--    Hanya superadmin yang boleh panggil.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION create_recipe_admin_account(
  p_email    text,
  p_password text,
  p_role     text DEFAULT 'admin'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM recipe_admin_role
    WHERE recipe_admin_role.user_id = auth.uid() AND recipe_admin_role.role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: superadmin only';
  END IF;

  IF p_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Invalid role: must be admin or superadmin';
  END IF;

  -- Cek apakah email sudah terdaftar
  SELECT id INTO v_user_id FROM auth.users WHERE email = lower(p_email);

  IF v_user_id IS NULL THEN
    -- Buat user baru di auth.users
    v_user_id := extensions.uuid_generate_v4();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      lower(p_email),
      crypt(p_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      provider,
      identity_data,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      lower(p_email),
      'email',
      jsonb_build_object('sub', v_user_id::text, 'email', lower(p_email)),
      now(),
      now(),
      now()
    );
  END IF;

  -- Assign role (upsert)
  INSERT INTO recipe_admin_role (user_id, role, created_by)
  VALUES (v_user_id, p_role, auth.uid())
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  -- Audit log
  INSERT INTO recipe_admin_audit_log (admin_id, action, target_type, target_id, detail)
  VALUES (
    auth.uid(),
    'create_admin',
    'admin',
    v_user_id::text,
    jsonb_build_object('email', lower(p_email), 'role', p_role)
  );

  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_recipe_admin_account(text, text, text) TO authenticated;

-- 7. RPC: ubah role admin (admin <-> superadmin)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_recipe_admin_role(
  p_target_user_id uuid,
  p_new_role       text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM recipe_admin_role
    WHERE recipe_admin_role.user_id = auth.uid() AND recipe_admin_role.role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: superadmin only';
  END IF;

  IF p_new_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Invalid role: must be admin or superadmin';
  END IF;

  UPDATE recipe_admin_role
  SET role = p_new_role
  WHERE recipe_admin_role.user_id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found in admin role table';
  END IF;

  INSERT INTO recipe_admin_audit_log (admin_id, action, target_type, target_id, detail)
  VALUES (
    auth.uid(),
    'update_role',
    'admin',
    p_target_user_id::text,
    jsonb_build_object('new_role', p_new_role)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION update_recipe_admin_role(uuid, text) TO authenticated;

-- 8. RPC: hapus akses admin (remove dari recipe_admin_role, user tetap ada)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION remove_recipe_admin(
  p_target_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM recipe_admin_role
    WHERE recipe_admin_role.user_id = auth.uid() AND recipe_admin_role.role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: superadmin only';
  END IF;

  -- Jangan bisa hapus diri sendiri
  IF p_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = p_target_user_id;

  DELETE FROM recipe_admin_role
  WHERE recipe_admin_role.user_id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found in admin role table';
  END IF;

  INSERT INTO recipe_admin_audit_log (admin_id, action, target_type, target_id, detail)
  VALUES (
    auth.uid(),
    'remove_admin',
    'admin',
    p_target_user_id::text,
    jsonb_build_object('email', v_email)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION remove_recipe_admin(uuid) TO authenticated;

-- 9. Buat akun admin di Supabase Dashboard
--    Buka Supabase Dashboard → Authentication → Users → "Add user" → "Create new user"
--    Centang "Auto Confirm User" supaya langsung aktif.
--
--    Akun-akun yang perlu dibuat (password dikirim terpisah, JANGAN simpan di repo):
--      nicolezoe83@gmail.com
--      zidni@20fit.id
--      tifany@20fit.id
--      admin@20fit.id
--
--    (luthfi@20fit.id sudah ada — tidak perlu dibuat ulang)
--
--    ALTERNATIF: setelah tabel + RPC di atas sudah jalan, superadmin bisa buat akun
--    langsung dari CMS (tab "Kelola Admin") — tidak perlu manual di dashboard lagi.
-- -------------------------------------------------------

-- 10. Seed: tambahkan role superadmin untuk semua akun admin awal
--     Jalankan SETELAH semua akun di atas sudah dibuat dan tabel di atas sudah jalan.
-- -------------------------------------------------------

-- 10a. Cari UUID semua akun admin:
--   SELECT id, email FROM auth.users
--   WHERE email IN ('luthfi@20fit.id', 'zidni@20fit.id', 'nicolezoe83@gmail.com', 'tifany@20fit.id', 'admin@20fit.id');

-- 10b. Insert semua sebagai superadmin:
--   INSERT INTO recipe_admin_role (user_id, role) VALUES ('<UUID_LUTHFI>', 'superadmin');
--   INSERT INTO recipe_admin_role (user_id, role) VALUES ('<UUID_ZIDNI>', 'superadmin');
--   INSERT INTO recipe_admin_role (user_id, role) VALUES ('<UUID_NICOLE>', 'superadmin');
--   INSERT INTO recipe_admin_role (user_id, role) VALUES ('<UUID_TIFANY>', 'superadmin');
--   INSERT INTO recipe_admin_role (user_id, role) VALUES ('<UUID_ADMIN>', 'superadmin');
