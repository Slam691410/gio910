/* Konfigurasi Proyek Terpadu GIO910 (Holding OS v4.7 · Biometrik 128-D + Voiceprint + e-KYC KTP/KIA/Passport + Supabase + Vercel) */
window.__KAI_UNIFIED_VERSION__ = '2026.11.28-v47-supabase-vercel';

/* Backend Utama: Supabase Postgres + Realtime + Storage + Edge Function (gio910-api) */
window.__KAI_SUPABASE_URL__ = window.__KAI_SUPABASE_URL__ || 'https://dttclgkjfiwcovvqrckw.supabase.co';
window.__KAI_SUPABASE_API_URL__ = window.__KAI_SUPABASE_API_URL__ || 'https://dttclgkjfiwcovvqrckw.supabase.co/functions/v1/gio910-api';
window.__KAI_SUPABASE_ANON_KEY__ = window.__KAI_SUPABASE_ANON_KEY__ || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dGNsZ2tqZml3Y292dnFyY2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2NTkzNzQsImV4cCI6MjExMTIzNTM3NH0.ozBfRkrgcVUBMfWTmOGhQprvoFLYcIzHr30-AGnlijE';

/* Hosting, Serverless Proxy & Edge CDN: Vercel */
window.__KAI_VERCEL_URL__ = window.__KAI_VERCEL_URL__ || 'https://gio910-jv38.vercel.app';

/* Hub 13 Konektor Ekosistem & Proxy Same-Origin Vercel */
window.__KAI_CONNECTORS__ = window.__KAI_CONNECTORS__ || {
  proxyEndpoint: '/api/connectors',
  totalConnectors: 13,
  activeCount: 12,
  activeSlugs: ['figma', 'gmail', 'google_calendar', 'google_docs', 'google_drive', 'google_sheets', 'google_slides', 'linear', 'notion', 'supabase', 'vercel', 'wordpress'],
  pausedSlugs: ['dropbox'],
  figmaFileKey: 'oiSuDVXhzfUzi0nSO7FFyB',
  linearProjectKey: 'GIO'
};

/* Parameter Default Copy Hub 5 Mode (sinkron dengan Supabase configurations: COPYHUB_HUB_PARAMS) */
window.__KAI_HUB_PARAMS__ = window.__KAI_HUB_PARAMS__ || {
  supabaseUrl: window.__KAI_SUPABASE_URL__,
  supabaseApiUrl: window.__KAI_SUPABASE_API_URL__,
  supabaseAnonKey: window.__KAI_SUPABASE_ANON_KEY__,
  vercelUrl: window.__KAI_VERCEL_URL__,
  connectorsProxy: '/api/connectors',
  mapsKey: '',
  freenameDomain: 'geraiinovasiolahan.gio910',
  ensSpace: 'gio910gerai.eth',
  daoDomain: 'gio910gerai.dao',
  chainId: '8453'
};

window.__GAS_MAPS_KEY__ = window.__GAS_MAPS_KEY__ || window.__KAI_HUB_PARAMS__.mapsKey || '';

/* Daftar modul resmi dalam 1 proyek terpadu Supabase + Vercel */
window.__KAI_UNIFIED_MODULES__ = [
  { id: 'portal', label: 'Portal Kantor AI', path: 'index.html', desc: 'Portal utama 4 Lantai (42 Ruang · 277 Meja), 14 layar kerja & Pusat Akuntansi Live GIO-5..11' },
  { id: 'mobile', label: 'Mobile Portal', path: 'gas-mobile/Index.html', desc: 'Portal Kantor AI responsif untuk perangkat seluler (native Vercel + Supabase)' },
  { id: 'copyhub', label: 'Copy Hub · 5 Mode', path: 'copy-hub.html', desc: 'Panduan 5 mode (Opsi 1–5) Supabase + Vercel + Konektor, Parameter Live & Paket ZIP' },
  { id: 'daohybrid', label: 'Hybrid DAO', path: 'dao/hybrid/dao-hybrid-widget.html', desc: 'Voting Snapshot tanpa gas fee + Safe Multi-sig + Sinkron Supabase (gio910gerai.eth)' },
  { id: 'daofull', label: 'Full DAO', path: 'dao/full/dao-full-console.html', desc: 'Konsol on-chain Gio910Token & Gio910Governor + enkripsi IPFS' },
  { id: 'seo', label: 'Widget SEO', path: 'seo/widget-ig-freename-kontak.html', desc: 'Video IG Reel, Rujukan Freename & Leads Kontak ke Supabase CRM' },
  { id: 'ekosistem', label: 'Pusat Ekosistem', path: 'ekosistem.html', desc: 'Diagnostik Supabase gio910-api, Vercel & Hub 13 Konektor Terpadu' }
];

/* Konfigurasi Halaman Video YouTube & Unduh Aplikasi Semua OS (pages/unduh.html) */
window.__KAI_MEDIA_CONFIG__ = window.__KAI_MEDIA_CONFIG__ || {
  appVersion: 'v2026.11.28-v47',
  appName: 'Portal Kantor AI — Holding Investasi GIO910',
  youtubeVideos: [
    {
      title: 'Panduan Portal Kantor AI (Supabase + Vercel + Konektor)',
      url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      desc: 'Tur operasional Kantor AI 4 Lantai (42 Ruang · 277 Meja), 160 Aset & Hub 13 Konektor.'
    }
  ],
  downloads: {
    windows:  { url: '/api/installer?os=windows',          altUrl: '/api/installer?os=windows&format=ps1',   file: 'KantorAI-GIO910-Win.bat',       altLabel: 'PowerShell (.ps1)',    note: 'Windows 10 / 11 (x64 & ARM64) · App Desktop WebView' },
    macos:    { url: '/api/installer?os=macos',            altUrl: '',                                       file: 'KantorAI-GIO910-Mac.command',   altLabel: '',                     note: 'macOS 12+ (Apple Silicon M1–M4 & Intel)' },
    linux:    { url: '/api/installer?os=linux',            altUrl: '/api/installer?os=linux&format=desktop', file: 'kantor-ai-linux-install.sh',    altLabel: 'File .desktop',        note: 'Ubuntu, Debian, Fedora, Arch (Desktop App / WebApp)' },
    android:  { url: '/api/installer?os=android',          altUrl: '',                                       file: 'WebAPK / PWA Android',          altLabel: '',                     note: 'Android 8.0+ (Chrome WebAPK Install Langsung)' },
    ios:      { url: '/api/installer?os=ios',              altUrl: '/api/installer?os=ios&format=pwa',       file: 'KantorAI-ios-WebClip.mobileconfig', altLabel: 'Panduan Safari PWA', note: 'iPhone iOS 15.0+ (Profil WebClip / Add to Home Screen)' },
    ipados:   { url: '/api/installer?os=ipados',           altUrl: '/api/installer?os=ipados&format=pwa',    file: 'KantorAI-ipados-WebClip.mobileconfig', altLabel: 'Panduan Safari PWA', note: 'iPad iPadOS 15.0+ (Profil WebClip / Layar Penuh)' },
    harmony:  { url: '/api/installer?os=harmony',          altUrl: '',                                       file: 'WebAPK / HarmonyOS WebApp',     altLabel: '',                     note: 'HarmonyOS / EMUI Browser Install Langsung' },
    chromeos: { url: '/api/installer?os=chromeos',         altUrl: '',                                       file: 'Web App ChromeOS',              altLabel: '',                     note: 'Chromebook ChromeOS (PWA / Chrome App)' }
  }
};
