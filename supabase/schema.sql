-- =============================================================
-- Schema untuk menu.20fit.id
-- Jalankan di Supabase SQL Editor
-- =============================================================

-- 1. Tabel resep/menu makanan
CREATE TABLE IF NOT EXISTS recipes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  category       TEXT NOT NULL CHECK (category IN ('breakfast','lunch','dinner','snack','drink')),
  description    TEXT,
  calories       NUMERIC(7,1) NOT NULL,
  protein_g      NUMERIC(6,1) NOT NULL DEFAULT 0,
  carbs_g        NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat_g          NUMERIC(6,1) NOT NULL DEFAULT 0,
  fiber_g        NUMERIC(6,1) NOT NULL DEFAULT 0,
  sugar_g        NUMERIC(6,1) NOT NULL DEFAULT 0,
  sodium_mg      NUMERIC(7,1) NOT NULL DEFAULT 0,
  serving_size   NUMERIC(6,1) NOT NULL DEFAULT 1,
  serving_unit   TEXT NOT NULL DEFAULT 'porsi',
  ingredients    JSONB NOT NULL DEFAULT '[]',
  steps          JSONB NOT NULL DEFAULT '[]',
  image_url      TEXT,
  prep_time_min  INT NOT NULL DEFAULT 0,
  cook_time_min  INT NOT NULL DEFAULT 0,
  tags           TEXT[] DEFAULT '{}',
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Profil kalori pengguna (terhubung ke auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  target_calories          NUMERIC(7,1) NOT NULL DEFAULT 2000,
  calories_consumed_today  NUMERIC(7,1) NOT NULL DEFAULT 0,
  last_reset_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Favorit resep
CREATE TABLE IF NOT EXISTS favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id  UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, recipe_id)
);

-- 4. Log makanan yang dimakan
CREATE TABLE IF NOT EXISTS meal_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id         UUID NOT NULL REFERENCES recipes(id),
  servings          NUMERIC(4,1) NOT NULL DEFAULT 1,
  eaten_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  calories_logged   NUMERIC(7,1) NOT NULL,
  protein_g_logged  NUMERIC(6,1) NOT NULL,
  carbs_g_logged    NUMERIC(6,1) NOT NULL,
  fat_g_logged      NUMERIC(6,1) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- Indexes
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_recipes_category    ON recipes (category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recipes_name        ON recipes USING gin (to_tsvector('indonesian', name));
CREATE INDEX IF NOT EXISTS idx_favorites_user      ON favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON meal_logs (user_id, eaten_at DESC);

-- =============================================================
-- Row Level Security
-- =============================================================
ALTER TABLE recipes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs     ENABLE ROW LEVEL SECURITY;

-- recipes: anyone can read active recipes
CREATE POLICY "recipes_public_read" ON recipes FOR SELECT USING (is_active = true);

-- user_profiles: only owner
CREATE POLICY "user_profiles_own" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- favorites: only owner
CREATE POLICY "favorites_own" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- meal_logs: only owner
CREATE POLICY "meal_logs_own" ON meal_logs
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================
-- Auto-update updated_at
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- Auto-reset calories_consumed_today harian
-- =============================================================
CREATE OR REPLACE FUNCTION reset_daily_calories()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.last_reset_date < CURRENT_DATE THEN
    NEW.calories_consumed_today := 0;
    NEW.last_reset_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reset_daily_calories
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION reset_daily_calories();

-- =============================================================
-- Auto-create user_profile on new auth user
-- =============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (user_id) VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_new_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
