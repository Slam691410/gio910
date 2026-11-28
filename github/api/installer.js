module.exports = async function handler(req, res) {
  const q = req.query || {};
  const os = String(q.os || "web").toLowerCase().trim();
  const fmt = String(q.format || "").toLowerCase().trim();
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "gio910-jv38.vercel.app").split(",")[0].trim();
  const baseUrl = `${proto}://${host}`;
  const appUrl = `${baseUrl}/index.html`;

  if (os === "windows" && fmt === "ps1") {
    const ps1 = [
      "# Kantor AI — Holding Investasi GIO910 Windows Installer",
      `$AppUrl = "${appUrl}"`,
      "$Desktop = [Environment]::GetFolderPath('Desktop')",
      "$ShortcutPath = Join-Path $Desktop 'Kantor AI GIO910.url'",
      `Set-Content -Path $ShortcutPath -Value "[InternetShortcut]\`r\`nURL=$AppUrl\`r\`n"`,
      "$Edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'",
      "if (Test-Path $Edge) { Start-Process $Edge \"--app=$AppUrl\" } else { Start-Process $AppUrl }",
      "Write-Host 'Shortcut Kantor AI GIO910 berhasil dibuat di Desktop!' -ForegroundColor Green",
    ].join("\r\n");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="KantorAI-GIO910-Setup.ps1"');
    return res.status(200).send(ps1);
  }

  if (os === "windows") {
    const bat = [
      "@echo off",
      "title Kantor AI — Holding Investasi GIO910",
      `set "APP_URL=${appUrl}"`,
      'echo [InternetShortcut] > "%USERPROFILE%\\Desktop\\Kantor AI GIO910.url"',
      'echo URL=%APP_URL% >> "%USERPROFILE%\\Desktop\\Kantor AI GIO910.url"',
      'if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (',
      '  start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app=%APP_URL%',
      ') else if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (',
      '  start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app=%APP_URL%',
      ") else (",
      '  start "" "%APP_URL%"',
      ")",
      "echo Pintasan Kantor AI GIO910 tersimpan di Desktop Anda.",
    ].join("\r\n");
    res.setHeader("Content-Type", "application/x-msdos-program; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="KantorAI-GIO910-Win.bat"');
    return res.status(200).send(bat);
  }

  if (os === "macos") {
    const cmd = [
      "#!/usr/bin/env bash",
      `APP_URL="${appUrl}"`,
      'WEBLOC="$HOME/Desktop/Kantor AI GIO910.webloc"',
      'cat > "$WEBLOC" <<EOF',
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
      '<plist version="1.0"><dict><key>URL</key><string>' + appUrl + '</string></dict></plist>',
      "EOF",
      'if [ -d "/Applications/Google Chrome.app" ]; then',
      '  open -a "Google Chrome" --args --app="$APP_URL"',
      "else",
      '  open "$APP_URL"',
      "fi",
    ].join("\n");
    res.setHeader("Content-Type", "text/x-shellscript; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="KantorAI-GIO910-Mac.command"');
    return res.status(200).send(cmd);
  }

  if (os === "linux") {
    if (fmt === "desktop") {
      const desktop = [
        "[Desktop Entry]",
        "Version=1.0",
        "Type=Application",
        "Name=Kantor AI GIO910",
        "Comment=Portal Holding Investasi GIO910",
        `Exec=xdg-open ${appUrl}`,
        "Terminal=false",
        "Categories=Office;Finance;",
      ].join("\n");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="kantor-ai-gio910.desktop"');
      return res.status(200).send(desktop);
    }
    const sh = [
      "#!/usr/bin/env bash",
      "set -e",
      `APP_URL="${appUrl}"`,
      'mkdir -p "$HOME/.local/share/applications"',
      'DESKTOP_FILE="$HOME/.local/share/applications/kantor-ai-gio910.desktop"',
      'cat > "$DESKTOP_FILE" <<EOF',
      "[Desktop Entry]",
      "Version=1.0",
      "Type=Application",
      "Name=Kantor AI GIO910",
      "Comment=Portal Holding Investasi GIO910",
      "Exec=sh -c 'command -v google-chrome >/dev/null && exec google-chrome --app=\"$0\" || command -v chromium >/dev/null && exec chromium --app=\"$0\" || exec xdg-open \"$0\"' " + appUrl,
      "Terminal=false",
      "Categories=Office;Finance;",
      "EOF",
      'chmod +x "$DESKTOP_FILE"',
      'echo "Terpasang di $DESKTOP_FILE — membuka Kantor AI GIO910..."',
      'xdg-open "$APP_URL" >/dev/null 2>&1 || true',
    ].join("\n");
    res.setHeader("Content-Type", "text/x-shellscript; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="kantor-ai-linux-install.sh"');
    return res.status(200).send(sh);
  }

  if ((os === "ios" || os === "ipados") && fmt !== "pwa") {
    const uuid1 = "910A0001-2026-4111-9000-000000000001";
    const uuid2 = "910A0001-2026-4111-9000-000000000002";
    const mobileconfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>FullScreen</key><true/>
      <key>IsRemovable</key><true/>
      <key>Label</key><string>Kantor AI GIO910</string>
      <key>PayloadDescription</key><string>WebClip Aplikasi Portal Kantor AI GIO910</string>
      <key>PayloadDisplayName</key><string>Kantor AI GIO910</string>
      <key>PayloadIdentifier</key><string>id.gio910.webclip</string>
      <key>PayloadType</key><string>com.apple.webClip.managed</string>
      <key>PayloadUUID</key><string>${uuid2}</string>
      <key>PayloadVersion</key><integer>1</integer>
      <key>Precomposed</key><true/>
      <key>URL</key><string>${appUrl}</string>
    </dict>
  </array>
  <key>PayloadDisplayName</key><string>Portal Kantor AI — Holding Investasi GIO910</string>
  <key>PayloadIdentifier</key><string>id.gio910.profile.${os}</string>
  <key>PayloadOrganization</key><string>PT HOLDING GIO910</string>
  <key>PayloadType</key><string>Configuration</string>
  <key>PayloadUUID</key><string>${uuid1}</string>
  <key>PayloadVersion</key><integer>1</integer>
</dict>
</plist>`;
    res.setHeader("Content-Type", "application/x-apple-aspen-config; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="KantorAI-${os}-WebClip.mobileconfig"`);
    return res.status(200).send(mobileconfig);
  }

  // Android / HarmonyOS / ChromeOS / Safari PWA Interactive Installer Page
  const labelMap = {
    android: "Android (Chrome / WebAPK)",
    harmony: "HarmonyOS (Huawei Browser / WebAPK)",
    chromeos: "ChromeOS (Chromebook App)",
    ios: "iOS Safari (Tambah ke Layar Utama)",
    ipados: "iPadOS Safari (Mode Layar Penuh)",
  };
  const label = labelMap[os] || "Web App / PWA Universal";
  const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="theme-color" content="#0b1220" />
  <link rel="manifest" href="${baseUrl}/manifest.webmanifest" />
  <title>Pasang Kantor AI GIO910 — ${label}</title>
  <style>
    body{margin:0;background:#0b1220;color:#e8eefc;font:15px/1.6 system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:20px}
    .card{max-width:560px;width:100%;background:#131f36;border:1px solid #22365c;border-radius:16px;padding:24px}
    h1{margin:0 0 8px;font-size:20px;color:#7dd3fc}
    .btn{display:inline-block;padding:10px 16px;border-radius:10px;background:#0ea5e9;color:#051322;font-weight:800;text-decoration:none;border:0;cursor:pointer;margin-right:8px;margin-top:10px}
    .btn2{background:#182845;color:#7dd3fc;border:1px solid #2b4370}
    code{background:#09111f;padding:2px 6px;border-radius:6px;color:#6ee7b7}
  </style>
</head>
<body>
  <div class="card">
    <h1>Pasang Aplikasi Kantor AI GIO910</h1>
    <p>Target Platform: <b>${label}</b></p>
    <p>Aplikasi ini menggunakan paket PWA terverifikasi dari <code>${baseUrl}</code> agar langsung terhubung dengan database live Supabase.</p>
    <button id="pwa-btn" class="btn" style="display:none">Instal Aplikasi Sekarang</button>
    <a class="btn" href="${appUrl}">Buka Portal Sekarang</a>
    <a class="btn btn2" href="${baseUrl}/pages/unduh.html">Kembali ke Pusat Unduh</a>
    <p id="hint" style="margin-top:14px;color:#9fb0d0;font-size:13px">Di Chrome/Edge/Android/HarmonyOS: tekan ikon menu browser (⋮) lalu pilih <b>Instal aplikasi / Tambah ke layar utama</b>. Di iPhone/iPad Safari: tekan <b>Share ⬆️ → Add to Home Screen</b>.</p>
  </div>
  <script>
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(function(){});
    var deferred = null;
    window.addEventListener("beforeinstallprompt", function(e) {
      e.preventDefault();
      deferred = e;
      var b = document.getElementById("pwa-btn");
      b.style.display = "inline-block";
      b.onclick = function() {
        if (!deferred) return;
        deferred.prompt();
        deferred.userChoice.then(function(){ deferred = null; });
      };
    });
  </script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(html);
};
