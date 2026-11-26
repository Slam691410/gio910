# 🚀 GIO910 - PANDUAN SETUP LENGKAP

## Daftar Isi
1. [Persiapan](#1-persiapan)
2. [Setup Supabase](#2-setup-supabase)
3. [Setup Google Cloud](#3-setup-google-cloud)
4. [Setup Linear](#4-setup-linear)
5. [Setup Notion](#5-setup-notion)
6. [Deploy Edge Functions](#6-deploy-edge-functions)
7. [Migrasi Data](#7-migrasi-data)
8. [Testing](#8-testing)
9. [Deployment ke Produksi](#9-deployment-ke-produksi)

---

## 1️⃣ Persiapan

### 1.1 Prerequisites
- Akun Supabase ([supabase.com](https://supabase.com))
- Akun Google Cloud ([cloud.google.com](https://cloud.google.com))
- Akun Linear ([linear.app](https://linear.app))
- Akun Notion ([notion.so](https://www.notion.so))
- Node.js v16+ (untuk local development)
- Supabase CLI

### 1.2 Install Tools

```bash
# Install Supabase CLI
npm install -g supabase

# Install Deno (untuk Edge Functions)
curl -fsSL https://deno.land/x/install/install.sh | sh

# Verify installations
supabase --version
denon --version
```

### 1.3 Clone Repository

```bash
cd /home/user/gio910
# Repository sudah ada, pastikan Anda di branch yang benar
git checkout arena/0df1103a-gio910
```

---

## 2️⃣ Setup Supabase

### 2.1 Buat Project Supabase

1. Buka [https://supabase.com](https://supabase.com)
2. Klik **New Project**
3. Isi:
   - Project Name: `gio910`
   - Database Password: (buat password kuat)
   - Region: `Asia Southeast (Singapore)` (terdekat dengan Jakarta)
4. Klik **Create Project**
5. Tunggu hingga project selesai dibuat (2-5 menit)

### 2.2 Setup Database

#### 2.2.1 Import Schema

1. Di dashboard Supabase, buka **SQL Editor**
2. Klik **New Query**
3. Copy seluruh isi file `supabase/sql/001_schema_core.sql`
4. Klik **Run**
5. Tunggu hingga semua query selesai

#### 2.2.2 Import RLS Policies

1. Buat query baru
2. Copy seluruh isi file `supabase/sql/002_rls_policies.sql`
3. Klik **Run**

#### 2.2.3 Verifikasi Database

```sql
-- Cek tabel-tabel
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Cek policies
SELECT table_name, policy_name FROM pg_policies;
```

### 2.3 Setup Authentication

1. Di dashboard Supabase, buka **Authentication > Providers**
2. Enable **Email** provider
3. Di **Authentication > Templates**, customize email templates
4. Di **Authentication > Settings**, atur:
   - Site URL: `https://gio910gerai.io`
   - Redirect URLs: `https://gio910gerai.io/*`

### 2.4 Setup Storage

1. Di dashboard Supabase, buka **Storage > Buckets**
2. Buat bucket baru:
   - Name: `documents`
   - Public: No
3. Buat bucket:
   - Name: `backups`
   - Public: No

### 2.5 Setup Environment Variables

1. Di dashboard Supabase, buka **Project Settings > Environment Variables**
2. Tambahkan variables:

```
# Google Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY=-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----

# Linear
LINEAR_API_KEY=your-linear-api-key

# Notion
NOTION_API_KEY=your-notion-api-key
```

3. Klik **Save**

### 2.6 Get Project Credentials

1. Di **Project Settings > API**, catat:
   - Project URL (SUPABASE_URL)
   - anon key (SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY)

---

## 3️⃣ Setup Google Cloud

### 3.1 Buat Project Google Cloud

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik **Create Project**
3. Isi:
   - Project Name: `GIO910`
   - Organization: (pilih jika ada)
4. Klik **Create**

### 3.2 Enable APIs

1. Buka **APIs & Services > Library**
2. Enable APIs berikut:
   - Google Sheets API
   - Google Drive API
   - Google Calendar API
   - Gmail API

### 3.3 Buat Service Account

1. Buka **IAM & Admin > Service Accounts**
2. Klik **Create Service Account**
3. Isi:
   - Service account name: `gio910-service-account`
   - Service account ID: (otomatis)
   - Description: `Service account untuk GIO910`
4. Klik **Create**
5. Pilih role:
   - Google Sheets: **Sheets API User**
   - Google Drive: **Drive API User**
   - Google Calendar: **Calendar API User**
   - Gmail: **Gmail API User**
6. Klik **Continue**
7. Klik **Done**

### 3.4 Generate Private Key

1. Di service account list, klik `gio910-service-account`
2. Buka tab **Keys**
3. Klik **Add Key > Create New Key**
4. Pilih **JSON**
5. Klik **Create**
6. File JSON akan terdownload, simpan dengan aman
7. Copy isi file JSON:
   - `client_email` → GOOGLE_SERVICE_ACCOUNT_EMAIL
   - `private_key` → GOOGLE_SERVICE_ACCOUNT_KEY

### 3.5 Share Resources

#### 3.5.1 Google Sheets
1. Buka Google Sheets yang digunakan
2. Klik **Share**
3. Tambahkan email service account: `your-service-account@project-id.iam.gserviceaccount.com`
4. Pilih role: **Editor**
5. Klik **Send**

#### 3.5.2 Google Drive
1. Buka folder GIO910 di Google Drive
2. Klik **Share**
3. Tambahkan email service account
4. Pilih role: **Editor**
5. Klik **Send**

#### 3.5.3 Google Calendar
1. Buka Google Calendar
2. Di calendar yang digunakan, klik **Settings and sharing**
3. Di **Share with specific people**, tambahkan email service account
4. Pilih permission: **Make changes to events**
5. Klik **Send**

#### 3.5.4 Gmail
1. Buka Gmail
2. Di **Settings > Accounts and Import**, tambahkan email service account sebagai delegasi
3. Atau setup email forwarding

---

## 4️⃣ Setup Linear

### 4.1 Buat Workspace

1. Buka [Linear](https://linear.app)
2. Klik **Create Workspace**
3. Isi:
   - Workspace Name: `GIO910`
   - Workspace URL: `gio910`
4. Klik **Create**

### 4.2 Setup Teams

1. Buka **Settings > Teams**
2. Buat teams:
   - Development
   - Management
   - Audit

### 4.3 Setup Labels

1. Buka **Settings > Labels**
2. Buat labels:
   - bug
   - feature
   - documentation
   - dao
   - seo
   - enhancement
   - high-priority
   - low-priority

### 4.4 Generate API Key

1. Buka **Settings > API**
2. Klik **Generate Key**
3. Copy API key
4. Tambahkan ke Supabase environment variables

### 4.5 Setup Webhooks (Opsional)

1. Buka **Settings > Webhooks**
2. Tambahkan webhook URL: `https://YOUR_SUPABASE_URL/functions/v1/gio910-api`
3. Pilih events yang diperlukan

---

## 5️⃣ Setup Notion

### 5.1 Buat Database

1. Buka [Notion](https://www.notion.so)
2. Buat workspace baru: `GIO910 Documentation`
3. Buat database:
   - Name: `Documents`
   - Properties:
     - Title (text)
     - Type (select: DAO, Panduan, SEO, Lainnya)
     - Category (select)
     - Status (select: Draft, Review, Published)
     - Priority (select: Low, Medium, High)
     - Assignee (person)
     - Tags (multi-select)

### 5.2 Generate API Key

1. Buka [Notion Integrations](https://www.notion.so/my-integrations)
2. Klik **Create New Integration**
3. Isi:
   - Name: `GIO910 Integration`
4. Klik **Submit**
5. Copy **Internal Integration Token**
6. Tambahkan ke Supabase environment variables

### 5.3 Share Database

1. Buka database yang dibuat
2. Klik **Share**
3. Di **Invite people**, cari integration yang dibuat
4. Klik **Invite**

---

## 6️⃣ Deploy Edge Functions

### 6.1 Link Supabase Project

```bash
# Login ke Supabase
supabase login

# Link project (jalankan di root repository)
cd /home/user/gio910
supabase link --project-ref your-project-ref
```

Cari project reference di:
- Dashboard Supabase > Project Settings > General > Project Reference

### 6.2 Deploy Function

```bash
# Deploy gio910-api function
cd /home/user/gio910/supabase/functions/gio910-api
supabase functions deploy gio910-api
```

### 6.3 Verify Deployment

1. Di dashboard Supabase, buka **Functions**
2. Pastikan `gio910-api` muncul
3. Klik function untuk melihat logs

### 6.4 Test Function

```bash
# Test health check
curl -i https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/health

# Test dengan authentication
curl -i -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/products
```

---

## 7️⃣ Migrasi Data

### 7.1 Export Data dari Google Sheets

#### Opsi 1: Manual Export
1. Buka Google Sheets
2. File > Download > CSV
3. Simpan file CSV

#### Opsi 2: Google Apps Script Export
```javascript
function exportSheetsToCSV() {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  sheets.forEach(sheet => {
    const data = sheet.getDataRange().getValues();
    // Save to Drive as CSV
    const csv = data.map(row => row.join(',')).join('\n');
    DriveApp.createFile(csv, `${sheet.getName()}.csv`, 'text/csv');
  });
}
```

### 7.2 Import Data ke Supabase

#### Opsi 1: SQL INSERT
```sql
-- Contoh untuk products
INSERT INTO products (name, description, price, category) VALUES
  ('Produk 1', 'Deskripsi produk 1', 100000, 'Kategori 1'),
  ('Produk 2', 'Deskripsi produk 2', 200000, 'Kategori 2');
```

#### Opsi 2: Import CSV via Dashboard
1. Di dashboard Supabase, buka **Table Editor**
2. Pilih tabel target
3. Klik **Import**
4. Upload file CSV
5. Map columns
6. Klik **Import**

#### Opsi 3: Script Python
```python
import csv
import psycopg2

conn = psycopg2.connect(
    host="YOUR_SUPABASE_URL",
    database="postgres",
    user="postgres",
    password="YOUR_PASSWORD"
)

cur = conn.cursor()

with open('products.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        cur.execute("""
            INSERT INTO products (name, description, price, category)
            VALUES (%s, %s, %s, %s)
        """, (row['name'], row['description'], row['price'], row['category']))

conn.commit()
cur.close()
conn.close()
```

### 7.3 Sync Data Otomatis

Gunakan endpoint `/api/google/sheets/sync`:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sheet_id": "YOUR_SHEET_ID",
    "range": "Sheet1!A:Z",
    "target_table": "products"
  }' \
  https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/google/sheets/sync
```

---

## 8️⃣ Testing

### 8.1 Test Authentication

```bash
# Send OTP
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "type": "email"}' \
  https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/auth/send-otp

# Verify OTP (gunakan OTP yang diterima)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "code": "123456", "type": "email"}' \
  https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/auth/verify-otp

# Set PIN (setelah login)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pin": "123456", "confirm_pin": "123456"}' \
  https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/auth/set-pin
```

### 8.2 Test Google Sheets

```bash
# Get sheet data
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/google/sheets/YOUR_SHEET_ID

# Sync sheet to database
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sheet_id": "YOUR_SHEET_ID",
    "range": "Sheet1!A:Z",
    "target_table": "products"
  }' \
  https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/google/sheets/sync
```

### 8.3 Test Products

```bash
# Get products
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/products

# Create product (Staf/Manajemen/Pemilik)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produk Baru",
    "description": "Deskripsi produk baru",
    "price": 150000,
    "category": "Kategori 1"
  }' \
  https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/products
```

### 8.4 Test Transactions

```bash
# Create transaction
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "pemasukan",
    "amount": 5000000,
    "description": "Pemasukan dari penjualan",
    "tax_amount": 500000,
    "discount_amount": 0
  }' \
  https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/transactions

# Approve transaction (Manajemen/Pemilik)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Approved"}' \
  https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/transactions/TRANSACTION_ID/approve
```

### 8.5 Test Linear Integration

```bash
# Create issue
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix bug login",
    "description": "Bug login tidak bisa verify OTP",
    "team_id": "TEAM_ID",
    "priority": 2,
    "labels": ["bug", "high-priority"]
  }' \
  https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/linear/issues

# Get issues
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/linear/issues
```

### 8.6 Test Notion Integration

```bash
# Create page
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "database_id": "DATABASE_ID",
    "title": "Panduan Penggunaan",
    "content": "Ini adalah panduan penggunaan GIO910",
    "properties": {
      "Type": {"select": {"name": "Panduan"}},
      "Status": {"select": {"name": "Published"}}
    }
  }' \
  https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/notion/pages
```

---

## 9️⃣ Deployment ke Produksi

### 9.1 Setup Custom Domain (Opsional)

1. Di dashboard Supabase, buka **Project Settings > Custom Domains**
2. Tambahkan domain: `api.gio910gerai.io`
3. Setup DNS records:
   - CNAME: `api.gio910gerai.io` → `YOUR_SUPABASE_URL`

### 9.2 Update Frontend

Update endpoint di frontend:

```javascript
// Sebelumnya (Apps Script)
const API_URL = 'https://script.google.com/macros/s/.../exec'

// Sekarang (Supabase)
const API_URL = 'https://YOUR_SUPABASE_URL/functions/v1/gio910-api'
```

### 9.3 Update Autentikasi Frontend

```javascript
// Sebelumnya
function login() {
  // Gunakan Google Apps Script auth
}

// Sekarang
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)

async function login(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
  })
  
  if (error) throw error
  return data
}
```

### 9.4 Setup Monitoring

1. Di dashboard Supabase, buka **Logs**
2. Setup alerts untuk:
   - Error rates
   - High latency
   - Failed authentications

### 9.5 Setup Backup

1. Di dashboard Supabase, buka **Database > Backups**
2. Enable automatic backups
3. Setup backup schedule (harian/mingguan)

---

## ✅ Checklist Deployment

- [ ] Supabase project dibuat
- [ ] Database schema di-import
- [ ] RLS policies di-import
- [ ] Authentication di-setup
- [ ] Storage buckets dibuat
- [ ] Environment variables di-setup
- [ ] Google Cloud project dibuat
- [ ] Google APIs enabled
- [ ] Service account dibuat
- [ ] Private key generated
- [ ] Resources di-share ke service account
- [ ] Linear workspace dibuat
- [ ] Linear API key generated
- [ ] Notion database dibuat
- [ ] Notion API key generated
- [ ] Edge functions deployed
- [ ] Data di-migrasi
- [ ] Testing selesai
- [ ] Frontend di-update
- [ ] Monitoring di-setup
- [ ] Backup di-setup

---

## 📞 Troubleshooting

### Masalah Umum

#### 1. CORS Error
```
Error: No 'Access-Control-Allow-Origin' header
```

**Solusi:**
- Pastikan CORS headers teratur di Edge Function
- Check origin di frontend
- Tambahkan domain ke Supabase CORS settings

#### 2. Authentication Failed
```
Error: Invalid or expired token
```

**Solusi:**
- Refresh token
- Cek token expiration
- Login ulang

#### 3. Permission Denied (RLS)
```
Error: permission denied for table users
```

**Solusi:**
- Cek RLS policies
- Cek user role
- Cek data ownership

#### 4. Google API Error
```
Error: Request had insufficient authentication scopes
```

**Solusi:**
- Cek service account permissions
- Cek API enabled
- Cek scope di Edge Function

#### 5. Connection Timeout
```
Error: Connection timeout
```

**Solusi:**
- Cek network connection
- Cek Supabase status
- Cek Google API quota

### Debugging Tools

#### 1. Supabase Logs
```bash
# View function logs
supabase functions logs --tail
```

#### 2. Database Logs
```sql
-- View recent queries
SELECT * FROM supabase.logs ORDER BY created_at DESC LIMIT 100;
```

#### 3. Test API dengan curl
```bash
# Test dengan verbose output
curl -v -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_SUPABASE_URL/functions/v1/gio910-api/api/health
```

---

## 🎉 Selamat!

Anda telah berhasil memigrasi GIO910 dari Google Apps Script ke arsitektur modern dengan:
- ✅ Supabase (Backend)
- ✅ Google APIs (Sheets, Drive, Calendar, Gmail)
- ✅ Linear (Issue Tracking)
- ✅ Notion (Documentation)

Sistem sekarang lebih:
- **Scalable** (bisa handle lebih banyak users)
- **Secure** (RLS, audit logs, proper auth)
- **Maintainable** (terstruktur, documented)
- **Modern** (API-based, real-time)

---

## 📚 Dokumentasi Tambahan

- [Supabase Documentation](https://supabase.com/docs)
- [Google APIs Documentation](https://developers.google.com/apis-explorer)
- [Linear API Documentation](https://developers.linear.app/docs)
- [Notion API Documentation](https://developers.notion.com/docs)

## 💬 Kontak

Untuk pertanyaan atau issue:
- Buka issue di repository GIO910
- Hubungi tim development
