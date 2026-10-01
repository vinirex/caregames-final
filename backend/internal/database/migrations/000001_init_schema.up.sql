-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS (idempotent via DO blocks)
-- ============================================================
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('earned', 'spent', 'adjustment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE challenge_type AS ENUM ('daily', 'weekly', 'seasonal', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE challenge_metric AS ENUM ('steps', 'water_ml', 'meditation_min', 'heart_rate', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE challenge_status AS ENUM ('available', 'in_progress', 'completed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE redemption_status AS ENUM ('pending', 'confirmed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE device_platform AS ENUM ('apple_health', 'health_connect', 'manual', 'mqtt');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE group_role AS ENUM ('member', 'admin', 'owner');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    age           INTEGER NOT NULL CHECK (age >= 18),
    role          VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- TABLE: user_api_keys
-- ============================================================
CREATE TABLE IF NOT EXISTS user_api_keys (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key      VARCHAR(68) UNIQUE NOT NULL,
    label        VARCHAR(100),
    last_used_at TIMESTAMPTZ,
    expires_at   TIMESTAMPTZ,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key  ON user_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON user_api_keys(user_id);

-- ============================================================
-- TABLE: user_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255),
    birthday    DATE,
    address     TEXT,
    photo_url   TEXT,
    theme_pref  VARCHAR(10) DEFAULT 'dark' CHECK (theme_pref IN ('dark', 'light')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: user_points
-- ============================================================
CREATE TABLE IF NOT EXISTS user_points (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance      INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_spent  INTEGER NOT NULL DEFAULT 0,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: point_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS point_transactions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount         INTEGER NOT NULL,
    type           transaction_type NOT NULL,
    reason         VARCHAR(255) NOT NULL,
    reference_id   UUID,
    reference_type VARCHAR(50),
    balance_after  INTEGER NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user    ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON point_transactions(created_at);

-- ============================================================
-- TABLE: seasons
-- ============================================================
CREATE TABLE IF NOT EXISTS seasons (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    starts_at   TIMESTAMPTZ NOT NULL,
    ends_at     TIMESTAMPTZ NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT FALSE,
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: challenges
-- ============================================================
CREATE TABLE IF NOT EXISTS challenges (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug          VARCHAR(100) UNIQUE NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT NOT NULL,
    icon_name     VARCHAR(100),
    type          challenge_type NOT NULL DEFAULT 'daily',
    metric        challenge_metric NOT NULL,
    target_value  NUMERIC(10,2) NOT NULL,
    target_unit   VARCHAR(50) NOT NULL,
    points_reward INTEGER NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    is_fixed      BOOLEAN NOT NULL DEFAULT FALSE,
    season_id     UUID REFERENCES seasons(id),
    created_by    UUID REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_type   ON challenges(type);

-- ============================================================
-- TABLE: user_challenge_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS user_challenge_progress (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id   UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    status         challenge_status NOT NULL DEFAULT 'available',
    current_value  NUMERIC(10,2) NOT NULL DEFAULT 0,
    completed_at   TIMESTAMPTZ,
    points_awarded INTEGER NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user   ON user_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON user_challenge_progress(user_id, status);

-- ============================================================
-- TABLE: benefits
-- ============================================================
CREATE TABLE IF NOT EXISTS benefits (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        VARCHAR(255) NOT NULL,
    description  TEXT NOT NULL,
    image_url    TEXT,
    points_cost  INTEGER NOT NULL CHECK (points_cost > 0),
    stock        INTEGER,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    category     VARCHAR(100),
    partner_name VARCHAR(255),
    valid_until  TIMESTAMPTZ,
    created_by   UUID REFERENCES users(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: benefit_redemptions
-- ============================================================
CREATE TABLE IF NOT EXISTS benefit_redemptions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    benefit_id   UUID NOT NULL REFERENCES benefits(id),
    points_spent INTEGER NOT NULL,
    status       redemption_status NOT NULL DEFAULT 'pending',
    voucher_code VARCHAR(100),
    redeemed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user ON benefit_redemptions(user_id);

-- ============================================================
-- TABLE: user_devices
-- ============================================================
CREATE TABLE IF NOT EXISTS user_devices (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform       device_platform NOT NULL,
    device_name    VARCHAR(255),
    sync_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- ============================================================
-- TABLE: health_sync_records
-- ============================================================
CREATE TABLE IF NOT EXISTS health_sync_records (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id      UUID REFERENCES user_devices(id),
    record_date    DATE NOT NULL,
    steps          INTEGER,
    heart_rate_bpm INTEGER,
    resting_hr_bpm INTEGER,
    temperature_c  NUMERIC(4,1),
    calories       INTEGER,
    distance_m     INTEGER,
    sleep_min      INTEGER,
    synced_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    platform       VARCHAR(50),
    raw_payload    JSONB,
    UNIQUE(user_id, record_date)
);

CREATE INDEX IF NOT EXISTS idx_health_user_date ON health_sync_records(user_id, record_date DESC);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    icon_name   VARCHAR(100) DEFAULT 'notifications',
    icon_color  VARCHAR(20)  DEFAULT '#00E5FF',
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- TABLE: groups
-- ============================================================
CREATE TABLE IF NOT EXISTS groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url  TEXT,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    owner_id    UUID NOT NULL REFERENCES users(id),
    is_public   BOOLEAN NOT NULL DEFAULT TRUE,
    max_members INTEGER DEFAULT 50,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: group_members
-- ============================================================
CREATE TABLE IF NOT EXISTS group_members (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role      group_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user  ON group_members(user_id);

-- ============================================================
-- TABLE: season_rankings
-- ============================================================
CREATE TABLE IF NOT EXISTS season_rankings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id       UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_snapshot INTEGER NOT NULL DEFAULT 0,
    rank_position   INTEGER,
    opt_in          BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(season_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_season_rankings_season ON season_rankings(season_id, points_snapshot DESC);

-- ============================================================
-- SEED: Fixed challenges
-- ============================================================
INSERT INTO challenges (slug, title, description, icon_name, type, metric, target_value, target_unit, points_reward, is_active, is_fixed)
VALUES
    ('steps_10k',      '10.000 passos por dia',  'Alcance sua meta diária de passos para melhorar a saúde cardiovascular.', 'directions-walk',  'daily', 'steps',         10000, 'steps',   100, TRUE, TRUE),
    ('water_2l',       'Beber 2L de Água',        'Mantenha-se hidratado ao longo do dia. Registre seu consumo diário.',     'water-drop',       'daily', 'water_ml',       2000, 'ml',       50, TRUE, TRUE),
    ('meditation_15m', '15 min de Meditação',     'Concentre sua mente com uma sessão diária de meditação guiada.',          'self-improvement', 'daily', 'meditation_min',   15, 'minutes',  75, TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;
