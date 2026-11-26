# 📂 GIO910 - Supabase Backend Index

## 🎯 Selamat Datang di Backend Baru GIO910!

Ini adalah **backend modern** yang sepenuhnya menggantikan Google Apps Script. Semua file yang Anda butuhkan untuk memigrasi sistem GIO910 sudah disiapkan.

---

## 📚 Daftar Isi

### 📖 Dokumentasi
| File | Deskripsi |
|------|-----------|
| [README.md](README.md) | Dokumentasi utama backend |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Panduan setup step-by-step |
| [SUMMARY.md](SUMMARY.md) | Ringkasan fitur dan struktur |
| [INDEX.md](INDEX.md) | Halaman ini |

### 🗃️ Database
| Folder/File | Deskripsi |
|-------------|-----------|
| [sql/](sql/) | Folder untuk SQL files |
| [001_schema_core.sql](sql/001_schema_core.sql) | Skema database utama (30+ tabel) |
| [002_rls_policies.sql](sql/002_rls_policies.sql) | Row Level Security policies |

### ⚡ Edge Functions
| Folder/File | Deskripsi |
|-------------|-----------|
| [functions/](functions/) | Folder untuk Edge Functions |
| [gio910-api/](functions/gio910-api/) | API utama |
| [index.ts](functions/gio910-api/index.ts) | Implementasi 50+ endpoints |

### ⚙️ Konfigurasi
| Folder/File | Deskripsi |
|-------------|-----------|
| [config/](config/) | Folder untuk konfigurasi |
| [.env.example](config/.env.example) | Template environment variables |
| [docker-compose.yml](docker-compose.yml) | Docker Compose untuk local development |

### 🌐 Infrastructure
| Folder/File | Deskripsi |
|-------------|-----------|
| [kong/](kong/) | Kong API Gateway configuration |
| [kong.yml](kong/kong.yml) | Kong declarative config |
| [nginx/](nginx/) | Nginx reverse proxy configuration |
| [supabase.conf](nginx/supabase.conf) | Nginx configuration |

### 📝 Lainnya
| File | Deskripsi |
|------|-----------|
| [.gitignore](.gitignore) | Git ignore rules |

---

## 🚀 Mulai Dari Mana?

### 1. Baca Dokumentasi
- **[SUMMARY.md](SUMMARY.md)** - Lihat ringkasan apa yang sudah dibuat
- **[README.md](README.md)** - Pahami arsitektur sistem

### 2. Setup Infrastructure
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Ikuti panduan step-by-step

### 3. Deploy
```bash
# Deploy Edge Function
cd functions/gio910-api
supabase functions deploy gio910-api
```

### 4. Migrasi Data
- Gunakan endpoint `/api/google/sheets/sync` untuk migrasi data

### 5. Update Frontend
- Ganti endpoint Apps Script ke Supabase

---

## 📊 Quick Stats

| Metrik | Jumlah |
|--------|--------|
| Tabel Database | 30+ |
| API Endpoints | 50+ |
| Fitur Security | 10+ |
| Integrasi Platform | 5 (Google, Linear, Notion, Gmail, Drive) |
| Dokumentasi | 5 file |

---

## 🎯 Fitur Unggulan

### ✅ Autentikasi
- OTP via Email
- Magic Link
- PIN Offline (SHA-256)
- JWT Tokens
- Session Management

### ✅ Google Integration
- Google Sheets (read/write/sync)
- Google Drive (upload/download)
- Google Calendar (events)
- Gmail (send emails)

### ✅ Business Logic
- Products Management
- Transactions dengan approval workflow
- 4-eyes principle
- Dual control
- Maker != Checker

### ✅ Security
- Row Level Security (RLS)
- Audit Trail
- Rate Limiting
- Input Validation
- Idempotency Keys

---

## 🔍 Cari Sesuatu?

### Database Schema
→ Lihat: [sql/001_schema_core.sql](sql/001_schema_core.sql)

### API Endpoints
→ Lihat: [functions/gio910-api/index.ts](functions/gio910-api/index.ts)

### Setup Guide
→ Lihat: [SETUP_GUIDE.md](SETUP_GUIDE.md)

### Security Policies
→ Lihat: [sql/002_rls_policies.sql](sql/002_rls_policies.sql)

---

## 💡 Tips Cepat

### 1. Local Development
```bash
# Mulai semua service dengan Docker
docker-compose up -d

# Stop semua service
docker-compose down
```

### 2. Test API
```bash
# Health check
curl http://localhost:8000/health

# Test dengan authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/functions/v1/gio910-api/api/products
```

### 3. Deploy ke Produksi
```bash
# Link project
supabase link --project-ref your-project-ref

# Deploy function
supabase functions deploy gio910-api
```

---

## ❓ Pertanyaan?

- **Apa yang sudah dibuat?** → [SUMMARY.md](SUMMARY.md)
- **Bagaimana setup?** → [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Bagaimana arsitekturnya?** → [README.md](README.md)
- **Ada error?** → Lihat troubleshooting di SETUP_GUIDE.md

---

## 🎉 Siap untuk Mulai?

Semua file sudah disiapkan! Anda tinggal:
1. Setup infrastructure
2. Deploy
3. Migrasi data
4. Update frontend

**Mulai sekarang!** 🚀

---

## 📞 Kontak

Untuk pertanyaan atau issue:
- Buka issue di repository
- Hubungi tim development
- Lihat dokumentasi di file-file di atas

---

*Last updated: 2026-11-26*
