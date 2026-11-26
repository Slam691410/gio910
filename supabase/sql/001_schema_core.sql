-- ============================================
-- GIO910 - SUPABASE DATABASE SCHEMA
-- Versi: 1.0.0
-- Tanggal: 2026-11-26
-- Deskripsi: Skema inti untuk menggantikan Google Apps Script
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS (Tipe data kustom)
-- ============================================

-- Role pengguna (sesuai TIERS di Apps Script)
CREATE TYPE user_role AS ENUM (
  'Pemilik',
  'Manajemen',
  'Staf',
  'Freelancer',
  'Auditor',
  'Tamu'
);

-- Status sesi
CREATE TYPE session_status AS ENUM (
  'active',
  'expired',
  'revoked'
);

-- Status OTP
CREATE TYPE otp_status AS ENUM (
  'pending',
  'used',
  'expired'
);

-- Tipe audit action
CREATE TYPE audit_action AS ENUM (
  'login',
  'logout',
  'create',
  'read',
  'update',
  'delete',
  'backup',
  'restore',
  'export',
  'import'
);

-- Tipe entity
CREATE TYPE entity_type AS ENUM (
  'user',
  'session',
  'otp',
  'product',
  'transaction',
  'document',
  'backup',
  'audit_log',
  'configuration'
);

-- Status transaksi
CREATE TYPE transaction_status AS ENUM (
  'draft',
  'pending',
  'approved',
  'rejected',
  'completed',
  'cancelled'
);

-- Tipe transaksi
CREATE TYPE transaction_type AS ENUM (
  'pemasukan',
  'pengeluaran',
  'transfer',
  'pembelian',
  'penjualan',
  'investasi'
);

-- ============================================
-- TABLES
-- ============================================

-- 1. USERS (Gantikan user management di Apps Script)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  password_hash TEXT,
  role user_role NOT NULL DEFAULT 'Tamu',
  
  -- Profile info
  avatar_url TEXT,
  bio TEXT,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  
  -- Security
  login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  
  -- Dual control thresholds (dari CFG di Apps Script)
  dual_control_threshold NUMERIC NOT NULL DEFAULT 5000000,
  four_eyes_threshold NUMERIC NOT NULL DEFAULT 100000000,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. SESSIONS (Gantikan session management di Apps Script)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  refresh_token TEXT UNIQUE,
  status session_status NOT NULL DEFAULT 'active',
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk sessions
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- 3. OTP_CODES (Gantikan OTP system di Apps Script)
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'reset_password')),
  status otp_status NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk OTP
CREATE INDEX idx_otp_codes_email ON otp_codes(email);
CREATE INDEX idx_otp_codes_code ON otp_codes(code);
CREATE INDEX idx_otp_codes_status ON otp_codes(status);
CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);

-- 4. PIN_CODES (Gantikan PIN offline di Apps Script)
CREATE TABLE pin_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL, -- SHA-256 hash
  salt TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_pin_codes_updated_at BEFORE UPDATE ON pin_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. AUDIT_LOGS (Gantikan audit di Apps Script)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  entity_type entity_type NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status_code INTEGER,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 6. CONFIGURATIONS (Gantikan CFG di Apps Script)
CREATE TABLE configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT,
  is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_configurations_updated_at BEFORE UPDATE ON configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. BACKUP_LOGS (Gantikan backup di Apps Script)
CREATE TABLE backup_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'manual')),
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  duration_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. IDENTOTENCY_KEYS (Untuk mencegah duplicate requests)
CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  response_data JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);

-- ============================================
-- GOOGLE INTEGRATION TABLES
-- ============================================

-- 9. GOOGLE_SHEETS_SYNC (Untuk sync data dari Google Sheets)
CREATE TABLE google_sheets_sync (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id TEXT NOT NULL,
  sheet_name TEXT NOT NULL,
  range TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  sync_error TEXT,
  row_count INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_google_sheets_sync_updated_at BEFORE UPDATE ON google_sheets_sync
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. GOOGLE_DRIVE_FILES (Untuk tracking file di Drive)
CREATE TABLE google_drive_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_file_id TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT,
  folder_id TEXT,
  file_size BIGINT,
  file_url TEXT,
  download_url TEXT,
  permissions JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_google_drive_files_updated_at BEFORE UPDATE ON google_drive_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. GOOGLE_CALENDAR_EVENTS (Untuk sync event Calendar)
CREATE TABLE google_calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_event_id TEXT NOT NULL UNIQUE,
  calendar_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  attendees JSONB,
  status TEXT,
  recurrence JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_google_calendar_events_updated_at BEFORE UPDATE ON google_calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- BUSINESS TABLES (GIO910 Specific)
-- ============================================

-- 12. PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  price NUMERIC(15,2) NOT NULL,
  cost NUMERIC(15,2),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT,
  images JSONB,
  specifications JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. TRANSACTIONS
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_number TEXT NOT NULL UNIQUE,
  type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'draft',
  
  -- Amounts
  amount NUMERIC(15,2) NOT NULL,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL,
  
  -- References
  reference_id UUID,
  reference_type TEXT,
  
  -- Parties
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Details
  description TEXT,
  notes TEXT,
  items JSONB,
  
  -- Approval (4 eyes principle)
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Dual control
  requires_dual_control BOOLEAN NOT NULL DEFAULT FALSE,
  second_approver UUID REFERENCES users(id) ON DELETE SET NULL,
  second_approved_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. DOCUMENTS (Untuk DAO dan dokumentasi)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  document_type TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  file_url TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15. NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS untuk semua tabel
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_sheets_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_drive_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- POLICIES akan ditambahkan di file terpisah

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert configurations dari CFG Apps Script
INSERT INTO configurations (key, value, description, category) VALUES
  ('VER', '2026.11.26', 'Version', 'system'),
  ('SESSION_HOURS', 8, 'Session duration in hours', 'auth'),
  ('DUAL_CONTROL_IDR', 5000000, 'Dual control threshold in IDR', 'finance'),
  ('FOUR_EYES_IDR', 100000000, 'Four eyes threshold in IDR', 'finance'),
  ('IDEMPOTENCY_SEC', 5, 'Idempotency key expiration in seconds', 'api'),
  ('QUOTA_SOFT_LIMIT', 1000, 'API quota soft limit', 'api'),
  ('AUDIT_RETENTION_DAYS', 730, 'Audit log retention in days', 'audit'),
  ('OTP_TTL_SEC', 300, 'OTP expiration in seconds', 'auth'),
  ('OTP_MAX_TRIES', 3, 'Maximum OTP attempts', 'auth'),
  ('OTP_MAX_REQ_15MIN', 5, 'Maximum OTP requests in 15 minutes', 'auth'),
  ('PIN_MAX_FAIL', 5, 'Maximum PIN failures before lock', 'auth'),
  ('PIN_LOCK_MIN', 15, 'PIN lock duration in minutes', 'auth'),
  ('IDLE_MIN', 30, 'Idle timeout in minutes', 'auth'),
  ('AUDIT_LIST_MAX', 5000, 'Maximum audit log entries to return', 'audit'),
  ('BACKUP_KEEP', 30, 'Number of backups to keep', 'backup')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'Daftar pengguna sistem GIO910';
COMMENT ON TABLE sessions IS 'Sesi login pengguna';
COMMENT ON TABLE otp_codes IS 'Kode OTP untuk autentikasi';
COMMENT ON TABLE pin_codes IS 'Kode PIN offline (SHA-256 hash)';
COMMENT ON TABLE audit_logs IS 'Log aktivitas untuk audit';
COMMENT ON TABLE configurations IS 'Konfigurasi sistem (gantikan CFG di Apps Script)';
COMMENT ON TABLE backup_logs IS 'Log backup sistem';
COMMENT ON TABLE idempotency_keys IS 'Kunci idempotensi untuk mencegah duplicate requests';
COMMENT ON TABLE google_sheets_sync IS 'Sinkronisasi data dari Google Sheets';
COMMENT ON TABLE google_drive_files IS 'File-file yang disimpan di Google Drive';
COMMENT ON TABLE google_calendar_events IS 'Event-event di Google Calendar';
COMMENT ON TABLE products IS 'Daftar produk GIO910';
COMMENT ON TABLE transactions IS 'Transaksi keuangan';
COMMENT ON TABLE documents IS 'Dokumen (DAO, panduan, dll)';
COMMENT ON TABLE notifications IS 'Notifikasi untuk pengguna';
