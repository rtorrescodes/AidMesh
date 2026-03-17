-- ─────────────────────────────────────────────────────────────────
-- AidMesh — Schema inicial
-- PostgreSQL + PostGIS
-- ─────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── ORGANIZACIONES ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ROLES ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  org_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USUARIOS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  trust_level SMALLINT DEFAULT 1 CHECK (trust_level BETWEEN 0 AND 3),
  role_id     UUID REFERENCES roles(id) ON DELETE SET NULL,
  org_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EVENTOS ─────────────────────────────────────────────────────

CREATE TYPE event_status AS ENUM (
  'preparacion', 'activo', 'contenido', 'cerrado', 'archivo'
);

CREATE TYPE event_type AS ENUM (
  'huracan', 'sismo', 'tsunami', 'inundacion', 'incendio',
  'busqueda_rescate', 'salud_publica', 'seguridad_civil', 'humanitario'
);

CREATE TYPE deployment_profile AS ENUM (
  'basico', 'busqueda_rescate', 'desastre_natural', 'crisis_mayor'
);

CREATE TABLE IF NOT EXISTS events (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    VARCHAR(255) NOT NULL,
  description             TEXT,
  type                    event_type NOT NULL,
  status                  event_status DEFAULT 'preparacion',
  deployment_profile      deployment_profile DEFAULT 'basico',
  escalation_timeout_min  INTEGER DEFAULT 30,
  zone                    JSONB,
  org_id                  UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  closed_at               TIMESTAMPTZ
);

-- ─── ALERTAS ─────────────────────────────────────────────────────

CREATE TYPE alert_severity AS ENUM (
  'verde', 'amarillo', 'naranja', 'rojo'
);

CREATE TYPE alert_type AS ENUM (
  'huracan', 'sismo', 'tsunami', 'inundacion', 'incendio',
  'busqueda_rescate', 'salud_publica', 'seguridad_civil'
);

CREATE TYPE alert_status AS ENUM (
  'activa', 'resuelta'
);

CREATE TABLE IF NOT EXISTS alerts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        alert_type NOT NULL,
  severity    alert_severity DEFAULT 'amarillo',
  status      alert_status DEFAULT 'activa',
  title       VARCHAR(255),
  description TEXT,
  latitude    DECIMAL(10, 7) NOT NULL,
  longitude   DECIMAL(10, 7) NOT NULL,
  location    GEOMETRY(POINT, 4326),
  radius_km   DECIMAL(8, 2) DEFAULT 1.0,
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  org_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_location ON alerts USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_alerts_event_id ON alerts (event_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status);

-- ─── COM TICKETS ─────────────────────────────────────────────────

CREATE TYPE ticket_status AS ENUM (
  'abierto', 'asignado', 'en_progreso', 'resuelto', 'cerrado'
);

CREATE TYPE ticket_priority AS ENUM (
  'baja', 'media', 'alta', 'critica'
);

CREATE TYPE need_type AS ENUM (
  'alimento', 'agua', 'medico', 'albergue',
  'rescate', 'transporte', 'suministros', 'seguridad'
);

CREATE TYPE resource_category AS ENUM (
  'víveres', 'medicamentos', 'equipo', 'personal',
  'vehículo', 'albergue'
);

CREATE TABLE IF NOT EXISTS com_tickets (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  need_type         need_type NOT NULL,
  resource_category resource_category NOT NULL,
  priority          ticket_priority DEFAULT 'media',
  status            ticket_status DEFAULT 'abierto',
  quantity          INTEGER,
  latitude          DECIMAL(10, 7) NOT NULL,
  longitude         DECIMAL(10, 7) NOT NULL,
  location          GEOMETRY(POINT, 4326),
  description       TEXT,
  payload           JSONB DEFAULT '{}',
  report_count      INTEGER DEFAULT 1,
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to       UUID REFERENCES users(id) ON DELETE SET NULL,
  org_id            UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tickets_location  ON com_tickets USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id  ON com_tickets (event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status    ON com_tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority  ON com_tickets (priority);

-- ─── SEÑALES CIUDADANAS ───────────────────────────────────────────

CREATE TYPE signal_status AS ENUM (
  'pendiente', 'revisada', 'confirmada', 'rechazada'
);

CREATE TABLE IF NOT EXISTS citizen_signals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  raw_message     TEXT NOT NULL,
  latitude        DECIMAL(10, 7),
  longitude       DECIMAL(10, 7),
  location        GEOMETRY(POINT, 4326),
  contact_info    VARCHAR(255),
  status          signal_status DEFAULT 'pendiente',
  linked_ticket_id UUID REFERENCES com_tickets(id) ON DELETE SET NULL,
  reviewed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signals_location ON citizen_signals USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_signals_event_id ON citizen_signals (event_id);
CREATE INDEX IF NOT EXISTS idx_signals_status   ON citizen_signals (status);

-- ─── MAP LAYERS ───────────────────────────────────────────────────

CREATE TYPE layer_type AS ENUM (
  'alert', 'shelter', 'hospital', 'police', 'vehicle', 'evacuation'
);

CREATE TABLE IF NOT EXISTS map_layers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  layer_type  layer_type NOT NULL,
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  org_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
  geom        JSONB NOT NULL,
  metadata    JSONB DEFAULT '{}',
  is_visible  BOOLEAN DEFAULT true,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_layers_event_id ON map_layers (event_id);

-- ─── RUTAS DE EMERGENCIA ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS emergency_routes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  org_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
  waypoints   JSONB NOT NULL DEFAULT '[]',
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routes_event_id ON emergency_routes (event_id);

-- ─── AUDIT LOG ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(100) NOT NULL,
  entity_id   UUID NOT NULL,
  action      VARCHAR(50) NOT NULL,
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email VARCHAR(255),
  diff        JSONB DEFAULT '{}',
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity    ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor     ON audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON audit_log (created_at DESC);

-- ─── TRIGGERS: updated_at automático ─────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON com_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_layers_updated_at
  BEFORE UPDATE ON map_layers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_routes_updated_at
  BEFORE UPDATE ON emergency_routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── DATOS INICIALES ─────────────────────────────────────────────

-- Organización base
INSERT INTO organizations (id, name, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Protección Civil BCS',
  'Piloto AidMesh — Baja California Sur'
) ON CONFLICT DO NOTHING;

-- Roles base
INSERT INTO roles (id, name, description, permissions) VALUES
(
  '00000000-0000-0000-0000-000000000010',
  'admin',
  'Administrador AidMesh — acceso total',
  '{
    "alerts:read": true, "alerts:create": true, "alerts:resolve": true,
    "com:send_structured": true, "com:send_open": true, "com:manage_templates": true,
    "vehicles:track": true, "vehicles:manage": true,
    "events:create": true, "events:manage": true, "events:close": true,
    "citizens:review_signals": true,
    "admin:manage_users": true, "admin:manage_roles": true
  }'::jsonb
),
(
  '00000000-0000-0000-0000-000000000011',
  'operador',
  'Operador de campo',
  '{
    "alerts:read": true, "alerts:create": true, "alerts:resolve": true,
    "com:send_structured": true, "com:send_open": true,
    "vehicles:track": true,
    "events:manage": true,
    "citizens:review_signals": true
  }'::jsonb
),
(
  '00000000-0000-0000-0000-000000000012',
  'voluntario',
  'Voluntario registrado',
  '{
    "alerts:read": true,
    "com:send_structured": true, "com:send_open": true,
    "vehicles:track": false
  }'::jsonb
) ON CONFLICT DO NOTHING;