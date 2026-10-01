# 📘 CareGames+ — Planejamento Completo de Backend API

> **Projeto:** CareGames+ — Portal de Saúde, Bem-Estar e Gamificação Cyber-Athletic  
> **Frontend:** React Native / Expo (já existente)  
> **Backend proposto:** Go + Gin Gonic Framework  
> **Banco de Dados:** PostgreSQL  
> **Autenticação:** API Key por usuário  
> **Data:** 2026-09-30

---

## 1. Visão Geral do Projeto

**CareGames+** é um aplicativo mobile de saúde gamificada que incentiva o usuário a adotar hábitos saudáveis (passos diários, hidratação, meditação) por meio de desafios com pontuação, rankings competitivos, integração com wearables (Apple HealthKit / Google Health Connect) e um sistema de recompensas (benefícios) resgatáveis com pontos acumulados.

### Módulos do Sistema

| Módulo | Descrição |
|---|---|
| **Auth** | Registro, login, API Key, perfil |
| **Challenges** | Desafios híbridos (fixos + dinâmicos), conclusão, progresso |
| **Points** | Saldo de pontos, histórico de transações |
| **Rankings** | Global, por categoria, por grupo, com temporadas |
| **Benefits** | Catálogo de benefícios, resgate por pontos |
| **Wearables/IoT** | Sincronização de saúde (passos, BPM, temperatura) |
| **Notifications** | Notificações persistidas por usuário |
| **Groups/Teams** | Criação de grupos, membros, ranking interno |
| **Seasons** | Temporadas com período definido pelo admin |

---

## 2. Schema do Banco de Dados (PostgreSQL)

### Diagrama de Entidades

```
users ─────────────── user_api_keys
  │
  ├── user_profiles
  ├── user_points_history ─── point_transactions
  ├── user_challenge_progress ─── challenges
  ├── user_benefit_redemptions ─── benefits
  ├── health_sync_records
  ├── user_devices
  ├── notifications
  ├── group_members ─── groups
  └── season_rankings ─── seasons
```

---

### 2.1 Tabela: `users`

Tabela central de autenticação e identidade do usuário.

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,          -- bcrypt hash
  age         INTEGER NOT NULL CHECK (age >= 18),
  role        VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos:**
- `id` — UUID gerado automaticamente (chave primária)
- `email` — e-mail único para autenticação
- `password_hash` — senha hasheada com bcrypt
- `age` — idade mínima 18 anos (validado no backend)
- `role` — `'user'` (padrão) ou `'admin'` (gerencia desafios, benefícios, temporadas)
- `is_active` — soft delete / desativação de conta

---

### 2.2 Tabela: `user_api_keys`

Gerenciamento de API Keys por usuário (método de autenticação escolhido).

```sql
CREATE TABLE user_api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key     VARCHAR(64) UNIQUE NOT NULL,       -- sha256 hash ou token seguro gerado
  label       VARCHAR(100),                       -- ex: "iPhone 15 Pro"
  last_used_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,                        -- NULL = sem expiração
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_key ON user_api_keys(api_key);
CREATE INDEX idx_api_keys_user ON user_api_keys(user_id);
```

---

### 2.3 Tabela: `user_profiles`

Dados pessoais e de perfil do usuário (separados da autenticação por boas práticas).

```sql
CREATE TABLE user_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(255),
  birthday     DATE,
  address      TEXT,
  photo_url    TEXT,                              -- URL da foto (futuro upload)
  theme_pref   VARCHAR(10) DEFAULT 'dark' CHECK (theme_pref IN ('dark', 'light')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 2.4 Tabela: `user_points`

Saldo atual de pontos do usuário (desnormalizado para leitura rápida em rankings).

```sql
CREATE TABLE user_points (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance      INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0,        -- acumulado histórico
  total_spent  INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 2.5 Tabela: `point_transactions`

Histórico completo de movimentações de pontos (auditoria e relatórios).

```sql
CREATE TYPE transaction_type AS ENUM ('earned', 'spent', 'adjustment');

CREATE TABLE point_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount          INTEGER NOT NULL,               -- positivo = ganho, negativo = gasto
  type            transaction_type NOT NULL,
  reason          VARCHAR(255) NOT NULL,          -- ex: 'challenge_complete:steps_10k'
  reference_id    UUID,                           -- ID do desafio, benefício, etc.
  reference_type  VARCHAR(50),                    -- 'challenge' | 'benefit' | 'manual'
  balance_after   INTEGER NOT NULL,               -- saldo após a transação
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_transactions_created ON point_transactions(created_at);
```

---

### 2.6 Tabela: `challenges`

Catálogo de desafios (fixos e dinâmicos — modelo híbrido escolhido).

```sql
CREATE TYPE challenge_type AS ENUM ('daily', 'weekly', 'seasonal', 'fixed');
CREATE TYPE challenge_metric AS ENUM ('steps', 'water_ml', 'meditation_min', 'heart_rate', 'custom');

CREATE TABLE challenges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            VARCHAR(100) UNIQUE NOT NULL,   -- ex: 'steps_10k', 'water_2l'
  title           VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL,
  icon_name       VARCHAR(100),                   -- nome do MaterialIcons
  type            challenge_type NOT NULL DEFAULT 'daily',
  metric          challenge_metric NOT NULL,
  target_value    NUMERIC(10,2) NOT NULL,          -- ex: 10000 para passos
  target_unit     VARCHAR(50) NOT NULL,            -- ex: 'steps', 'ml', 'minutes'
  points_reward   INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_fixed        BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = fixo (ex: steps_10k sempre existe)
  season_id       UUID REFERENCES seasons(id),     -- NULL = sem temporada
  created_by      UUID REFERENCES users(id),       -- admin que criou
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_challenges_active ON challenges(is_active);
CREATE INDEX idx_challenges_type ON challenges(type);
```

---

### 2.7 Tabela: `user_challenge_progress`

Estado de progresso/conclusão de cada desafio por usuário.

```sql
CREATE TYPE challenge_status AS ENUM ('available', 'in_progress', 'completed', 'expired');

CREATE TABLE user_challenge_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id      UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  status            challenge_status NOT NULL DEFAULT 'available',
  current_value     NUMERIC(10,2) NOT NULL DEFAULT 0,  -- progresso atual
  completed_at      TIMESTAMPTZ,
  points_awarded    INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX idx_progress_user ON user_challenge_progress(user_id);
CREATE INDEX idx_progress_status ON user_challenge_progress(user_id, status);
```

---

### 2.8 Tabela: `benefits`

Catálogo de benefícios resgatáveis gerenciado por admins.

```sql
CREATE TABLE benefits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL,
  image_url       TEXT,
  points_cost     INTEGER NOT NULL CHECK (points_cost > 0),
  stock           INTEGER,                         -- NULL = ilimitado
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  category        VARCHAR(100),                    -- ex: 'wellness', 'fitness', 'nutrition'
  partner_name    VARCHAR(255),                    -- ex: 'Academia X', 'Nutricionista Y'
  valid_until     TIMESTAMPTZ,                     -- NULL = sem validade
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 2.9 Tabela: `benefit_redemptions`

Histórico de resgates de benefícios por usuário.

```sql
CREATE TYPE redemption_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE benefit_redemptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  benefit_id   UUID NOT NULL REFERENCES benefits(id),
  points_spent INTEGER NOT NULL,
  status       redemption_status NOT NULL DEFAULT 'pending',
  voucher_code VARCHAR(100),                      -- código gerado no resgate
  redeemed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  notes        TEXT
);

CREATE INDEX idx_redemptions_user ON benefit_redemptions(user_id);
```

---

### 2.10 Tabela: `health_sync_records`

Histórico de telemetria de saúde enviada pelo app (passos, BPM, temperatura).

```sql
CREATE TABLE health_sync_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id       UUID REFERENCES user_devices(id),
  record_date     DATE NOT NULL,                   -- data do registro (para deduplicação)
  steps           INTEGER,
  heart_rate_bpm  INTEGER,
  resting_hr_bpm  INTEGER,
  temperature_c   NUMERIC(4,1),
  calories        INTEGER,
  distance_m      INTEGER,
  sleep_min       INTEGER,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  platform        VARCHAR(50),                     -- 'apple_health' | 'health_connect' | 'manual'
  raw_payload     JSONB,                           -- dados extras/futuros sem schema fixo
  UNIQUE(user_id, record_date)                     -- um registro consolidado por dia por usuário
);

CREATE INDEX idx_health_user_date ON health_sync_records(user_id, record_date DESC);
```

---

### 2.11 Tabela: `user_devices`

Dispositivos/plataformas de saúde conectados pelo usuário.

```sql
CREATE TYPE device_platform AS ENUM ('apple_health', 'health_connect', 'manual', 'mqtt');

CREATE TABLE user_devices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform        device_platform NOT NULL,
  device_name     VARCHAR(255),                    -- ex: 'Apple Watch Series 9'
  sync_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);
```

---

### 2.12 Tabela: `notifications`

Notificações persistidas por usuário no banco.

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  icon_name   VARCHAR(100) DEFAULT 'notifications',
  icon_color  VARCHAR(20) DEFAULT '#00E5FF',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
```

---

### 2.13 Tabela: `seasons`

Temporadas gerenciadas por admins para o sistema de ranking competitivo.

```sql
CREATE TABLE seasons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,              -- ex: 'Temporada 4 – Cyber-Athletic'
  description TEXT,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 2.14 Tabela: `groups`

Times/grupos de usuários com ranking interno.

```sql
CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  avatar_url  TEXT,
  invite_code VARCHAR(20) UNIQUE NOT NULL,         -- código para entrar no grupo
  owner_id    UUID NOT NULL REFERENCES users(id),
  is_public   BOOLEAN NOT NULL DEFAULT TRUE,
  max_members INTEGER DEFAULT 50,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 2.15 Tabela: `group_members`

Membros de cada grupo.

```sql
CREATE TYPE group_role AS ENUM ('member', 'admin', 'owner');

CREATE TABLE group_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        group_role NOT NULL DEFAULT 'member',
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
```

---

### 2.16 Tabela: `season_rankings` (Materializada/Cache)

Cache desnormalizado de rankings por temporada (para leitura rápida).

```sql
CREATE TABLE season_rankings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id       UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_snapshot INTEGER NOT NULL DEFAULT 0,
  rank_position   INTEGER,
  opt_in          BOOLEAN NOT NULL DEFAULT TRUE,   -- usuário optou por participar
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(season_id, user_id)
);

CREATE INDEX idx_season_rankings_season ON season_rankings(season_id, points_snapshot DESC);
```

---

## 3. Endpoints da API CRUD

> **Base URL:** `/api/v1`  
> **Autenticação:** Header `X-API-Key: {api_key}`  
> **Content-Type:** `application/json`

---

### 3.1 Módulo: Auth (`/auth`)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Registrar novo usuário | ❌ Público |
| `POST` | `/auth/login` | Login e obtenção da API Key | ❌ Público |
| `POST` | `/auth/logout` | Invalidar API Key atual | ✅ |
| `GET` | `/auth/me` | Dados do usuário autenticado | ✅ |
| `GET` | `/auth/keys` | Listar API Keys do usuário | ✅ |
| `DELETE` | `/auth/keys/:key_id` | Revogar uma API Key | ✅ |

#### POST `/auth/register`
```json
// Request Body
{
  "email": "joao@email.com",
  "password": "Senha123",
  "age": 25
}

// Response 201
{
  "success": true,
  "message": "Usuário cadastrado com sucesso",
  "user_id": "uuid"
}
```

#### POST `/auth/login`
```json
// Request Body
{
  "email": "joao@email.com",
  "password": "Senha123"
}

// Response 200
{
  "success": true,
  "api_key": "cgk_a1b2c3d4e5f6...",
  "user_id": "uuid",
  "email": "joao@email.com",
  "role": "user"
}
```

---

### 3.2 Módulo: Perfil (`/profile`)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `GET` | `/profile` | Obter perfil completo | ✅ |
| `PUT` | `/profile` | Atualizar nome, birthday, address | ✅ |
| `GET` | `/profile/photo` | Obter URL da foto de perfil | ✅ |
| `GET` | `/profile/:user_id` | Perfil público de outro usuário | ✅ |

#### GET `/profile` — Response
```json
{
  "user_id": "uuid",
  "email": "joao@email.com",
  "name": "João Silva",
  "birthday": "1999-05-20",
  "address": "São Paulo, SP",
  "photo_url": null,
  "theme_pref": "dark",
  "role": "user",
  "created_at": "2026-01-15T10:00:00Z"
}
```

#### PUT `/profile` — Request Body
```json
{
  "name": "João Silva",
  "birthday": "1999-05-20",
  "address": "São Paulo, SP",
  "theme_pref": "dark"
}
```

---

### 3.3 Módulo: Pontos (`/points`)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `GET` | `/points` | Saldo atual de pontos | ✅ |
| `GET` | `/points/history` | Histórico de transações (paginado) | ✅ |
| `POST` | `/points/add` | Adicionar pontos (admin only) | ✅ Admin |
| `POST` | `/points/spend` | Gastar pontos manualmente | ✅ |

#### GET `/points` — Response
```json
{
  "balance": 1250,
  "total_earned": 3500,
  "total_spent": 2250,
  "updated_at": "2026-09-30T22:00:00Z"
}
```

#### GET `/points/history?page=1&limit=20` — Response
```json
{
  "transactions": [
    {
      "id": "uuid",
      "amount": 100,
      "type": "earned",
      "reason": "Desafio concluído: 10.000 passos",
      "reference_id": "uuid-challenge",
      "reference_type": "challenge",
      "balance_after": 1250,
      "created_at": "2026-09-30T20:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

### 3.4 Módulo: Desafios (`/challenges`)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `GET` | `/challenges` | Listar desafios ativos | ✅ |
| `GET` | `/challenges/:id` | Detalhes de um desafio | ✅ |
| `POST` | `/challenges` | Criar desafio (admin) | ✅ Admin |
| `PUT` | `/challenges/:id` | Atualizar desafio (admin) | ✅ Admin |
| `DELETE` | `/challenges/:id` | Desativar desafio (admin) | ✅ Admin |
| `GET` | `/challenges/my` | Meus desafios + status de progresso | ✅ |
| `POST` | `/challenges/:id/complete` | Concluir desafio | ✅ |
| `PUT` | `/challenges/:id/progress` | Atualizar progresso do desafio | ✅ |
| `GET` | `/challenges/:id/progress` | Ver progresso do usuário neste desafio | ✅ |

#### GET `/challenges` — Response
```json
{
  "challenges": [
    {
      "id": "uuid",
      "slug": "steps_10k",
      "title": "10.000 passos por dia",
      "description": "...",
      "icon_name": "directions-walk",
      "type": "daily",
      "metric": "steps",
      "target_value": 10000,
      "target_unit": "steps",
      "points_reward": 100,
      "is_fixed": true,
      "user_progress": {
        "status": "in_progress",
        "current_value": 6500,
        "percent": 65
      }
    }
  ]
}
```

#### POST `/challenges/:id/complete` — Response
```json
{
  "success": true,
  "points_awarded": 100,
  "new_balance": 1350,
  "notification": "Desafio concluído! +100 PTS"
}
```

#### PUT `/challenges/:id/progress` — Request Body
```json
{
  "current_value": 7500
}
```

---

### 3.5 Módulo: Benefícios (`/benefits`)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `GET` | `/benefits` | Listar benefícios ativos | ✅ |
| `GET` | `/benefits/:id` | Detalhes de um benefício | ✅ |
| `POST` | `/benefits` | Criar benefício (admin) | ✅ Admin |
| `PUT` | `/benefits/:id` | Atualizar benefício (admin) | ✅ Admin |
| `DELETE` | `/benefits/:id` | Desativar benefício (admin) | ✅ Admin |
| `POST` | `/benefits/:id/redeem` | Resgatar benefício com pontos | ✅ |
| `GET` | `/benefits/redemptions` | Histórico de resgates do usuário | ✅ |
| `GET` | `/benefits/redemptions/:id` | Detalhe de um resgate | ✅ |

#### POST `/benefits/:id/redeem` — Response
```json
{
  "success": true,
  "redemption_id": "uuid",
  "voucher_code": "CARE-SPA-ABC123",
  "points_spent": 5000,
  "new_balance": 250,
  "message": "Benefício resgatado! Guarde seu código: CARE-SPA-ABC123"
}
```

---

### 3.6 Módulo: Wearables/IoT (`/health`)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `POST` | `/health/sync` | Enviar dados de saúde (telemetria) | ✅ |
| `GET` | `/health/records` | Histórico de sincronizações | ✅ |
| `GET` | `/health/records/:date` | Registro de uma data específica | ✅ |
| `GET` | `/health/summary` | Resumo da semana atual | ✅ |
| `GET` | `/health/devices` | Listar dispositivos vinculados | ✅ |
| `PUT` | `/health/devices/:platform` | Atualizar configuração do dispositivo | ✅ |
| `DELETE` | `/health/devices/:platform` | Desvincular dispositivo | ✅ |

#### POST `/health/sync` — Request Body
```json
{
  "record_date": "2026-09-30",
  "steps": 8500,
  "heart_rate_bpm": 72,
  "resting_hr_bpm": 60,
  "temperature_c": 36.8,
  "calories": 420,
  "distance_m": 6200,
  "sleep_min": 465,
  "platform": "apple_health"
}
```

#### GET `/health/summary` — Response
```json
{
  "week": [
    {
      "date": "2026-09-24",
      "steps": 12000,
      "heart_rate_bpm": 75,
      "platform": "apple_health"
    },
    {
      "date": "2026-09-25",
      "steps": 8900,
      "heart_rate_bpm": 80,
      "platform": "apple_health"
    }
  ],
  "averages": {
    "steps": 9800,
    "heart_rate_bpm": 73
  }
}
```

#### PUT `/health/devices/:platform` — Request Body
```json
{
  "device_name": "Apple Watch Series 10",
  "sync_enabled": true
}
```

---

### 3.7 Módulo: Rankings (`/rankings`)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `GET` | `/rankings/global` | Ranking global da temporada ativa | ✅ |
| `GET` | `/rankings/global/me` | Posição do usuário no ranking global | ✅ |
| `POST` | `/rankings/global/opt-in` | Optar por participar do ranking global | ✅ |
| `POST` | `/rankings/global/opt-out` | Sair do ranking global | ✅ |
| `GET` | `/rankings/category/:metric` | Ranking por categoria (steps, water, etc.) | ✅ |
| `GET` | `/rankings/groups` | Rankings dos grupos do usuário | ✅ |

#### GET `/rankings/global?limit=20&offset=0` — Response
```json
{
  "season": {
    "id": "uuid",
    "name": "Temporada 4 – Cyber-Athletic",
    "ends_at": "2026-10-12T23:59:59Z"
  },
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "uuid",
      "name": "Alice Smith",
      "avatar_url": "https://...",
      "initials": "AS",
      "points": 2450,
      "is_current_user": false
    }
  ],
  "current_user": {
    "rank": 4,
    "points": 1250,
    "opt_in": true
  },
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 3.8 Módulo: Temporadas (`/seasons`) — Admin

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `GET` | `/seasons` | Listar temporadas | ✅ |
| `GET` | `/seasons/active` | Temporada ativa atual | ✅ Público |
| `GET` | `/seasons/:id` | Detalhes de uma temporada | ✅ |
| `POST` | `/seasons` | Criar temporada (admin) | ✅ Admin |
| `PUT` | `/seasons/:id` | Atualizar temporada (admin) | ✅ Admin |
| `DELETE` | `/seasons/:id` | Remover temporada (admin) | ✅ Admin |
| `POST` | `/seasons/:id/activate` | Ativar temporada (admin) | ✅ Admin |

#### POST `/seasons` — Request Body (Admin)
```json
{
  "name": "Temporada 5 – Saúde Total",
  "description": "Nova temporada de saúde com foco em bem-estar mental.",
  "starts_at": "2026-10-13T00:00:00Z",
  "ends_at": "2026-11-10T23:59:59Z"
}
```

---

### 3.9 Módulo: Notificações (`/notifications`)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `GET` | `/notifications` | Listar notificações do usuário | ✅ |
| `GET` | `/notifications/unread-count` | Contagem de não lidas | ✅ |
| `PUT` | `/notifications/:id/read` | Marcar notificação como lida | ✅ |
| `PUT` | `/notifications/read-all` | Marcar todas como lidas | ✅ |
| `DELETE` | `/notifications/:id` | Deletar notificação | ✅ |
| `DELETE` | `/notifications/read` | Deletar todas as lidas | ✅ |
| `POST` | `/notifications` | Criar notificação (admin/sistema) | ✅ Admin |

#### GET `/notifications?page=1&limit=30` — Response
```json
{
  "notifications": [
    {
      "id": "uuid",
      "title": "Desafio Concluído! 🎉",
      "message": "Você ganhou +100 PTS por concluir \"10.000 passos por dia\".",
      "icon_name": "emoji-events",
      "icon_color": "#FBBF24",
      "is_read": false,
      "created_at": "2026-09-30T20:15:00Z"
    }
  ],
  "unread_count": 3
}
```

---

### 3.10 Módulo: Grupos (`/groups`)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| `GET` | `/groups` | Listar grupos do usuário | ✅ |
| `GET` | `/groups/public` | Buscar grupos públicos | ✅ |
| `GET` | `/groups/:id` | Detalhes de um grupo | ✅ |
| `POST` | `/groups` | Criar grupo | ✅ |
| `PUT` | `/groups/:id` | Atualizar grupo (owner/admin) | ✅ |
| `DELETE` | `/groups/:id` | Deletar grupo (owner) | ✅ |
| `POST` | `/groups/join` | Entrar em grupo via código | ✅ |
| `POST` | `/groups/:id/leave` | Sair do grupo | ✅ |
| `GET` | `/groups/:id/members` | Listar membros | ✅ |
| `DELETE` | `/groups/:id/members/:user_id` | Remover membro (owner/admin) | ✅ |
| `GET` | `/groups/:id/ranking` | Ranking interno do grupo | ✅ |

#### POST `/groups` — Request Body
```json
{
  "name": "Squad Saúde FIAP",
  "description": "Grupo dos alunos focados em saúde!",
  "is_public": true,
  "max_members": 30
}
```

#### POST `/groups/join` — Request Body
```json
{
  "invite_code": "SAUDE2026"
}
```

#### GET `/groups/:id/ranking` — Response
```json
{
  "group": {
    "id": "uuid",
    "name": "Squad Saúde FIAP"
  },
  "ranking": [
    {
      "rank": 1,
      "user_id": "uuid",
      "name": "João Silva",
      "points": 3200,
      "is_current_user": true
    }
  ]
}
```

---

## 4. Arquitetura do Backend Go/Gin

### 4.1 Estrutura de Diretórios Sugerida

```
caregames-api/
├── cmd/
│   └── server/
│       └── main.go               # Entry point
├── internal/
│   ├── config/
│   │   └── config.go             # Env vars, DB config
│   ├── database/
│   │   ├── postgres.go           # Conexão PostgreSQL (pgx/sqlx)
│   │   └── migrations/           # Arquivos .sql de migration
│   ├── middleware/
│   │   ├── auth.go               # Middleware de API Key
│   │   ├── admin.go              # Middleware de role admin
│   │   ├── cors.go               # CORS para mobile
│   │   └── logger.go             # Logging de requisições
│   ├── models/                   # Structs Go mapeados às tabelas
│   │   ├── user.go
│   │   ├── challenge.go
│   │   ├── benefit.go
│   │   ├── health.go
│   │   ├── notification.go
│   │   ├── season.go
│   │   └── group.go
│   ├── handlers/                 # Controllers HTTP (Gin handlers)
│   │   ├── auth_handler.go
│   │   ├── profile_handler.go
│   │   ├── points_handler.go
│   │   ├── challenge_handler.go
│   │   ├── benefit_handler.go
│   │   ├── health_handler.go
│   │   ├── ranking_handler.go
│   │   ├── notification_handler.go
│   │   ├── season_handler.go
│   │   └── group_handler.go
│   ├── services/                 # Lógica de negócio
│   │   ├── auth_service.go
│   │   ├── points_service.go     # Transações atômicas de pontos
│   │   ├── challenge_service.go  # Validação de metas, conclusão
│   │   ├── benefit_service.go    # Verificação de estoque, geração de voucher
│   │   ├── health_service.go     # Processamento de telemetria
│   │   ├── ranking_service.go    # Cálculo de posições
│   │   └── group_service.go
│   ├── repositories/             # Acesso ao banco de dados
│   │   ├── user_repo.go
│   │   ├── challenge_repo.go
│   │   ├── benefit_repo.go
│   │   ├── health_repo.go
│   │   ├── notification_repo.go
│   │   ├── season_repo.go
│   │   └── group_repo.go
│   └── router/
│       └── router.go             # Registro de rotas Gin
├── pkg/
│   ├── apikey/
│   │   └── generator.go          # Geração segura de API Keys
│   ├── crypto/
│   │   └── password.go           # bcrypt hash/verify
│   ├── pagination/
│   │   └── pagination.go         # Helpers de paginação
│   └── response/
│       └── response.go           # Helpers de resposta JSON padronizada
├── .env.example
├── go.mod
├── go.sum
└── Makefile
```

---

### 4.2 Padrão de Resposta da API

Todas as respostas devem seguir o padrão:

```json
// Sucesso
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}

// Erro
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "E-mail ou senha inválidos"
  }
}

// Lista paginada
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

---

### 4.3 Middleware de Autenticação por API Key

```go
// Fluxo de autenticação
// 1. App envia header: X-API-Key: cgk_a1b2c3...
// 2. Middleware busca na tabela user_api_keys WHERE api_key = $1 AND is_active = TRUE
// 3. Verifica se expires_at é futuro (se definido)
// 4. Atualiza last_used_at
// 5. Injeta user_id e role no contexto Gin
// 6. Handler acessa via: c.GetString("user_id"), c.GetString("role")
```

---

### 4.4 Dependências Go Sugeridas

```go
// go.mod
require (
  github.com/gin-gonic/gin              v1.10.x   // Framework HTTP
  github.com/jmoiron/sqlx               v1.4.x    // SQL helper para PostgreSQL
  github.com/lib/pq                     v1.10.x   // Driver PostgreSQL
  github.com/google/uuid                v1.6.x    // Geração de UUIDs
  golang.org/x/crypto                   v0.x.x    // bcrypt para senhas
  github.com/golang-migrate/migrate     v4.x.x    // Migrations de banco
  github.com/joho/godotenv              v1.5.x    // Variáveis de ambiente
  github.com/gin-contrib/cors           v1.7.x    // CORS middleware
)
```

---

## 5. Nuances e Objetos Específicos do Projeto

### 5.1 Sistema de Pontos — Transações Atômicas

O sistema de pontos é **crítico** e deve usar transações PostgreSQL para garantir consistência:

```
REGRA: Nunca atualizar user_points.balance sem inserir em point_transactions.
REGRA: Verificar saldo antes de gastar (check balance >= cost).
REGRA: Challenges concluídos não podem ser concluídos novamente (idempotência).
```

**Fluxo de conclusão de desafio:**
1. Verificar se `user_challenge_progress.status != 'completed'`
2. Validar meta atingida (ex: steps >= 10000 via health_sync_records)
3. BEGIN TRANSACTION
4. UPDATE `user_challenge_progress` SET status='completed'
5. INSERT em `point_transactions`
6. UPDATE `user_points` SET balance = balance + reward
7. INSERT em `notifications` (desafio concluído)
8. COMMIT

---

### 5.2 Sistema de Desafios Híbrido

Os desafios **fixos** (slugs conhecidos pelo app) têm `is_fixed = TRUE` e slugs estáveis:
- `steps_10k` — 10.000 passos
- `water_2l` — Beber 2L de água
- `meditation_15m` — 15 min de meditação

O app pode referenciar esses slugs hardcoded para retrocompatibilidade. Desafios **dinâmicos** criados por admins são servidos completamente via API.

**Desafios diários:** `type = 'daily'` — resetam a cada dia (via `user_challenge_progress` com `record_date`)
**Desafios de temporada:** `type = 'seasonal'`, vinculados a `season_id`

---

### 5.3 Validação de Metas de Desafio

Para o desafio `steps_10k`, a API deve **validar automaticamente** usando o registro de saúde do dia:

```
POST /challenges/steps_10k/complete
→ service busca health_sync_records WHERE user_id = ? AND record_date = TODAY
→ se steps >= 10000: permite conclusão
→ se não: retorna 422 com steps atuais
```

Para hidratação e meditação (sem wearable), o usuário auto-relata o progresso via `PUT /challenges/:id/progress`.

---

### 5.4 Sistema de Rankings — Cálculo de Posição

O ranking **não precisa ser calculado em tempo real** para cada requisição. Estratégia recomendada:

```sql
-- View materializada ou consulta direta para ranking global
SELECT
  u.id,
  p.name,
  p.photo_url,
  up.balance AS points,
  RANK() OVER (ORDER BY up.balance DESC) AS rank_position
FROM users u
JOIN user_profiles p ON u.id = p.user_id
JOIN user_points up ON u.id = up.user_id
JOIN season_rankings sr ON u.id = sr.user_id
WHERE sr.season_id = $1
  AND sr.opt_in = TRUE
ORDER BY up.balance DESC
LIMIT $2 OFFSET $3;
```

---

### 5.5 Geração Segura de API Keys

```
Formato: cgk_{32 bytes aleatórios em hex} = "cgk_" + 64 chars
Exemplo: cgk_a3f1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2

Armazenar: hash SHA-256 da key no banco (nunca a key em plaintext)
Retornar: key plaintext apenas na resposta do login (única vez)
```

---

### 5.6 Sincronização de Saúde — Deduplicação

A tabela `health_sync_records` tem `UNIQUE(user_id, record_date)` — um registro consolidado por dia.

O endpoint `POST /health/sync` usa `INSERT ... ON CONFLICT (user_id, record_date) DO UPDATE`:

```sql
INSERT INTO health_sync_records (user_id, record_date, steps, heart_rate_bpm, platform, ...)
VALUES ($1, $2, $3, $4, $5, ...)
ON CONFLICT (user_id, record_date) DO UPDATE SET
  steps = EXCLUDED.steps,
  heart_rate_bpm = EXCLUDED.heart_rate_bpm,
  synced_at = NOW();
```

---

### 5.7 Benefícios — Controle de Estoque e Vouchers

```
FLUXO DE RESGATE:
1. Verificar benefit.is_active = TRUE
2. Verificar benefit.stock IS NULL OR benefit.stock > 0
3. Verificar user_points.balance >= benefit.points_cost
4. BEGIN TRANSACTION
5. UPDATE user_points: balance -= cost
6. INSERT point_transactions (type = 'spent')
7. INSERT benefit_redemptions com voucher gerado
8. UPDATE benefits: stock = stock - 1 (se stock IS NOT NULL)
9. INSERT notifications
10. COMMIT
```

**Geração de voucher:** `CARE-{CATEGORY}-{6 chars aleatórios uppercase}` ex: `CARE-SPA-K9X2MF`

---

### 5.8 Grupos — Código de Convite

```
Formato: 6-8 chars alfanuméricos uppercase sem ambiguidade (sem 0, O, I, 1)
Exemplo: SAUDE26, CARE2026, FIAP99

UNIQUE constraint em groups.invite_code
Gerado no momento de criação do grupo
```

---

### 5.9 Notificações — Criação Automática pelo Sistema

A tabela `notifications` é populada automaticamente por eventos internos da API:

| Evento | Trigger | Mensagem |
|---|---|---|
| Desafio concluído | `POST /challenges/:id/complete` | "Você ganhou +X PTS por concluir..." |
| Benefício resgatado | `POST /benefits/:id/redeem` | "Voucher: CARE-XXX-YYY" |
| Nova temporada ativa | Admin ativa temporada | "Uma nova temporada começou!" |
| Subiu no ranking | Cálculo periódico | "Você subiu para #X no ranking!" |
| Entrou em grupo | `POST /groups/join` | "Bem-vindo ao grupo XYZ!" |

---

### 5.10 Variáveis de Ambiente

```env
# Servidor
PORT=8080
ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=caregames_db
DB_USER=caregames
DB_PASSWORD=senha_segura
DB_SSL_MODE=disable

# Segurança
API_KEY_PREFIX=cgk_
BCRYPT_COST=12

# CORS
ALLOWED_ORIGINS=*
```

---

## 6. Tabela de Códigos de Erro HTTP

| Código | Situação |
|---|---|
| `200 OK` | Sucesso geral |
| `201 Created` | Recurso criado |
| `400 Bad Request` | Dados inválidos/malformados |
| `401 Unauthorized` | API Key ausente ou inválida |
| `403 Forbidden` | Role insuficiente (ex: requer admin) |
| `404 Not Found` | Recurso não encontrado |
| `409 Conflict` | E-mail já cadastrado, desafio já concluído |
| `422 Unprocessable` | Regra de negócio violada (pontos insuficientes, meta não atingida) |
| `500 Internal Server Error` | Erro inesperado no servidor |

---

## 7. Roadmap de Implementação Sugerido

| Fase | Módulo | Prioridade |
|---|---|---|
| 1 | Auth (register, login, API Key) | 🔴 Crítico |
| 1 | Perfil (GET, PUT) | 🔴 Crítico |
| 1 | Pontos (saldo, histórico) | 🔴 Crítico |
| 2 | Desafios fixos (list, complete) | 🟠 Alta |
| 2 | Wearables/Saúde (sync, history) | 🟠 Alta |
| 2 | Rankings básico (global) | 🟠 Alta |
| 3 | Benefícios (catálogo, resgate) | 🟡 Média |
| 3 | Notificações | 🟡 Média |
| 3 | Temporadas (admin CRUD) | 🟡 Média |
| 4 | Grupos/Times | 🟢 Futura |
| 4 | Rankings por categoria | 🟢 Futura |
| 4 | Desafios dinâmicos (admin CRUD) | 🟢 Futura |

---

## 8. Resumo das Tabelas

| Tabela | Linhas estimadas (1 ano, 1000 users) |
|---|---|
| `users` | ~1.000 |
| `user_api_keys` | ~2.000 |
| `user_profiles` | ~1.000 |
| `user_points` | ~1.000 |
| `point_transactions` | ~150.000 |
| `challenges` | ~50 |
| `user_challenge_progress` | ~50.000 |
| `benefits` | ~30 |
| `benefit_redemptions` | ~10.000 |
| `health_sync_records` | ~365.000 |
| `user_devices` | ~2.000 |
| `notifications` | ~200.000 |
| `seasons` | ~12 |
| `season_rankings` | ~12.000 |
| `groups` | ~100 |
| `group_members` | ~3.000 |

---

*Documento gerado em: 2026-09-30 | Versão: 1.0*  
*Projeto: CareGames+ | Backend: Go/Gin + PostgreSQL*
