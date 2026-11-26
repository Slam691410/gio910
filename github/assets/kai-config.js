/* Konfigurasi Koneksi Domain -> Google Apps Script (Opsi 3)
 * Ganti string kosong di bawah dengan URL /exec Web App Apps Script Anda,
 * contoh: 'https://script.google.com/macros/s/AKfycbxxxx/exec'
 */
window.__KAI_GAS_API_URL__ = window.__KAI_GAS_API_URL__ || '';
window.__GAS_MAPS_KEY__ = window.__GAS_MAPS_KEY__ || '';

/* Konfigurasi Halaman Video YouTube & Unduh Aplikasi Semua OS (pages/unduh.html)
 * Isi link YouTube dan link unduhan installer tiap OS di sini kapan saja sudah siap.
 */
window.__KAI_MEDIA_CONFIG__ = window.__KAI_MEDIA_CONFIG__ || {
  appVersion: 'v2026.11.24',
  appName: 'Portal Kantor AI — Holding Investasi',
  youtubeVideos: [
    // Contoh: { title: 'Video Profil & Panduan Portal', url: 'https://www.youtube.com/watch?v=XXXXXXXXXXX', desc: 'Pengenalan sistem kerja 3 lantai Kantor AI.' }
  ],
  downloads: {
    windows:  { url: '', altUrl: '', file: 'KantorAI-Setup-Win-x64.exe',    altLabel: 'ARM64 / MSIX', note: 'Windows 10 / 11 (64-bit & ARM64)' },
    macos:    { url: '', altUrl: '', file: 'KantorAI-Universal.dmg',        altLabel: 'PKG Installer', note: 'macOS 12+ (Apple Silicon M1–M4 & Intel)' },
    linux:    { url: '', altUrl: '', file: 'KantorAI-x86_64.AppImage',      altLabel: 'Paket .deb / .rpm', note: 'Ubuntu, Debian, Fedora, Arch (AppImage / DEB / RPM)' },
    android:  { url: '', altUrl: '', file: 'KantorAI-Android.apk',          altLabel: 'Google Play Store', note: 'Android 8.0+ (APK / Play Store)' },
    ios:      { url: '', altUrl: '', file: 'App Store (iOS)',               altLabel: 'TestFlight', note: 'iPhone iOS 15.0+ (App Store / TestFlight)' },
    ipados:   { url: '', altUrl: '', file: 'App Store (iPadOS)',            altLabel: 'TestFlight', note: 'iPad iPadOS 15.0+ (App Store / Layar Penuh)' },
    harmony:  { url: '', altUrl: '', file: 'KantorAI-HarmonyOS.apk',        altLabel: 'Huawei AppGallery', note: 'HarmonyOS / Huawei AppGallery' },
    chromeos: { url: '', altUrl: '', file: 'Web App / Play Store ChromeOS', altLabel: 'Paket Linux (.deb)', note: 'Chromebook ChromeOS (PWA / Android / Linux)' }
  }
};

