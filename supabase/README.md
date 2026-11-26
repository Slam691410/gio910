# GIO910 - Supabase Backend

## 📋 Overview

Ini adalah backend baru untuk **GIO910 - GERAI INOVASI OLAHAN** yang sepenuhnya menggantikan Google Apps Script. Backend ini menggunakan:

- **Supabase** (PostgreSQL, Auth, Storage, Edge Functions)
- **Google APIs** (Sheets, Drive, Calendar, Gmail)
- **Linear** (Issue Tracking)
- **Notion** (Documentation)

## 🚀 Quick Start

### 1. Setup Supabase Project

1. Buat proyek baru di [https://supabase.com](https://supabase.com)
2. Buka **SQL Editor** di dashboard Supabase
3. Jalankan skema database:
   ```bash
   # Import file SQL
   psql -h YOUR_SUPABASE_URL -U postgres -d postgres -f sql/001_schema_core.sql
   ```
   Atau copy-paste isi file `001_schema_core.sql` ke SQL Editor

4. Jalankan RLS policies:
   ```bash
   # Import RLS policies
   psql -h YOUR_SUPABASE_URL -U postgres -d postgres -f sql/002_rls_policies.sql
   ```

### 2. Setup Environment Variables

1. Di Supabase, buka **Project Settings > API**
2. Salin `Project URL` dan `anon key`
3. Di **Project Settings > Environment Variables**, tambahkan:
   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_KEY=-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----
   LINEAR_API_KEY=your-linear-api-key
   NOTION_API_KEY=your-notion-api-key
   ```

### 3. Deploy Edge Functions

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login ke Supabase:
   ```bash
   supabase login
   ```

3. Link proyek:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Deploy function:
   ```bash
   cd functions/gio910-api
   supabase functions deploy gio910-api
   ```

### 4. Setup Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru
3. Enable APIs:
   - Google Sheets API
   - Google Drive API
   - Google Calendar API
   - Gmail API
4. Buat Service Account:
   - IAM & Admin > Service Accounts
   - Buat service account baru
   - Generate private key (JSON)
   - Copy email dan private key ke environment variables
5. Share Google Sheets/Drive dengan service account email

### 5. Setup Linear

1. Buka [Linear](https://linear.app)
2. Buat workspace baru untuk GIO910
3. Generate API key di Settings > API
4. Tambahkan ke environment variables

### 6. Setup Notion

1. Buka [Notion](https://www.notion.so)
2. Buat database untuk dokumentasi
3. Generate Integration Token di My Integrations
4. Share database dengan integration
5. Tambahkan token ke environment variables

## 📊 Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | Daftar pengguna |
| `sessions` | Session login |
| `otp_codes` | Kode OTP |
| `pin_codes` | Kode PIN |
| `audit_logs` | Log aktivitas |
| `configurations` | Konfigurasi sistem |
| `backup_logs` | Log backup |
| `idempotency_keys` | Kunci idempotensi |

### Google Integration Tables

| Table | Description |
|-------|-------------|
| `google_sheets_sync` | Sinkronisasi Sheets |
| `google_drive_files` | File di Drive |
| `google_calendar_events` | Event Calendar |

### Business Tables

| Table | Description |
|-------|-------------|
| `products` | Daftar produk |
| `transactions` | Transaksi keuangan |
| `documents` | Dokumen (DAO, panduan) |
| `notifications` | Notifikasi |

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Kirim OTP |
| POST | `/api/auth/verify-otp` | Verifikasi OTP |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/set-pin` | Set PIN |
| POST | `/api/auth/verify-pin` | Verifikasi PIN |

### Google Sheets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/google/sheets/{sheetId}` | Get sheet data |
| POST | `/api/google/sheets/sync` | Sync sheet ke database |

### Google Drive

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/google/drive/upload` | Upload file |
| GET | `/api/google/drive/files` | List files |

### Google Calendar

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/google/calendar/events` | Buat event |
| GET | `/api/google/calendar/events` | List events |

### Gmail

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/google/gmail/send` | Kirim email |

### Linear

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/linear/issues` | Buat issue |
| GET | `/api/linear/issues` | List issues |

### Notion

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notion/pages` | Buat halaman |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products |
| POST | `/api/products` | Buat product |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions` | Buat transaction |
| POST | `/api/transactions/{id}/approve` | Approve transaction |
| POST | `/api/transactions/{id}/second-approve` | Second approve (dual control) |
| POST | `/api/transactions/{id}/reject` | Reject transaction |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List documents |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| POST | `/api/notifications/mark-read` | Mark as read |

### Audit Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit-logs` | List audit logs |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

## 🔐 Security Features

### 1. Row Level Security (RLS)
Semua tabel dilindungi dengan RLS policies yang ketat:
- Users hanya bisa melihat data mereka sendiri
- Pemilik dan Manajemen bisa melihat semua data
- Auditor bisa melihat audit logs

### 2. Autentikasi
- OTP via email
- PIN offline (SHA-256 hash)
- JWT tokens dengan expiration
- Session management

### 3. Audit Trail
- Semua perubahan data dicatat di `audit_logs`
- IP address dan user agent disimpan
- Old dan new values disimpan

### 4. 4 Eyes Principle
- Transaksi di atas 100M IDR memerlukan approval
- Dual control untuk transaksi di atas 5M IDR
- Maker != Checker principle

### 5. Rate Limiting
- OTP max 5 requests per 15 menit
- PIN max 5 attempts sebelum lock

## 📝 Migration Guide

### Dari Google Apps Script ke Supabase

1. **Export data dari Google Sheets**
   ```bash
   # Gunakan Google Sheets API untuk export data
   # Atau export manual ke CSV
   ```

2. **Import ke Supabase**
   ```bash
   # Gunakan SQL INSERT statements
   # Atau gunakan Supabase dashboard
   ```

3. **Update frontend**
   - Ganti endpoint Apps Script ke endpoint Supabase
   - Update autentikasi
   - Update API calls

4. **Testing**
   - Test semua endpoint
   - Test autentikasi
   - Test integrasi Google

## 🎯 Best Practices

### 1. Environment Variables
- Jangan hardcode credentials
- Gunakan environment variables
- Rotate keys secara berkala

### 2. Security
- Gunakan HTTPS
- Validasi input
- Sanitize output
- Gunakan prepared statements

### 3. Performance
- Gunakan indexing
- Limit query results
- Gunakan pagination
- Cache frequent queries

### 4. Monitoring
- Monitor API usage
- Monitor error rates
- Setup alerts

## 🐛 Troubleshooting

### Common Issues

1. **CORS Error**
   - Pastikan CORS headers teratur
   - Check origin di frontend

2. **Authentication Failed**
   - Cek token expiration
   - Cek OTP/PIN
   - Cek user permissions

3. **Google API Error**
   - Cek service account permissions
   - Cek API enabled
   - Cek quota

4. **RLS Permission Denied**
   - Cek policies
   - Cek user role
   - Cek data ownership

## 📞 Support

Untuk pertanyaan atau issue:
- Buka issue di repository
- Hubungi tim development

## 📄 License

Private - Hanya untuk penggunaan internal GIO910

## 🏷️ Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2026-11-26 | Initial release |
