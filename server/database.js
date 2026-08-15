import pg from "pg";

const { Pool } = pg;

export function createPool() {
  const hasDiscreteConfig = process.env.POSTGRES_HOST || process.env.PGHOST;
  if (hasDiscreteConfig) {
    return new Pool({
      host: process.env.POSTGRES_HOST || process.env.PGHOST,
      port: Number(process.env.POSTGRES_PORT || process.env.PGPORT || 5432),
      database: process.env.POSTGRES_DB || process.env.PGDATABASE || "stow",
      user: process.env.POSTGRES_USER || process.env.PGUSER || "stow",
      password: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  if (process.env.DATABASE_URL) {
    const connectionString = process.env.DATABASE_URL.replace(/^postgresql\+asyncpg:\/\//, "postgresql://");
    return new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });
  }

  return null;
}

export const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    handle TEXT NOT NULL UNIQUE,
    gmail TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    terms_accepted_at TIMESTAMPTZ NOT NULL,
    privacy_accepted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT
  );
  CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('clip', 'note', 'link', 'code')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    device TEXT NOT NULL DEFAULT '此裝置',
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    collection TEXT NOT NULL DEFAULT 'work',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS items_owner_updated_idx ON items(owner_id, updated_at DESC);

  CREATE TABLE IF NOT EXISTS shares (
    token_hash TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    access_type TEXT NOT NULL CHECK (access_type IN ('recipient', 'link')),
    recipient_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
  );
  CREATE INDEX IF NOT EXISTS shares_item_id_idx ON shares(item_id);
  CREATE INDEX IF NOT EXISTS shares_recipient_idx ON shares(recipient_user_id);

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS password_reset_expires_at_idx ON password_reset_tokens(expires_at);
`;
