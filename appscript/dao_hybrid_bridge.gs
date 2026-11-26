/**
 * dao_hybrid_bridge.gs — Jembatan Hybrid DAO (Snapshot + Safe -> Portal Apps Script)
 * Ukuran sengaja dijaga < 13,5 KB agar aman di-paste di editor Apps Script HP.
 *
 * Cara pasang di proyek Apps Script Anda (di samping Code_1_Core.gs .. Code_5_Backup.gs):
 * 1. Klik + -> Script -> beri nama: dao_hybrid_bridge
 * 2. Tempel seluruh isi file ini -> Save.
 * 3. (Opsional) Di Project Settings -> Script Properties tambahkan:
 *    - DAO_ENS_SPACE  = gio910gerai.eth
 *    - DAO_SAFE_ADDR  = 0x... (alamat Safe Multi-sig jika ada)
 *    - DAO_CHAIN_ID   = 1     (1=Ethereum, 8453=Base, 42161=Arbitrum)
 * 4. Jalankan fungsi `installDaoSyncTrigger()` 1 kali agar proposal Snapshot otomatis
 *    tersinkron setiap 15 menit ke tab Google Sheets `DAO_Proposals`.
 */

const DAO_CFG_ = {
  ENDPOINT: 'https://hub.snapshot.org/graphql',
  SHEET_NAME: 'DAO_Proposals',
  DEFAULT_SPACE: 'gio910gerai.eth'
};

function getDaoProps_() {
  var sp = PropertiesService.getScriptProperties();
  return {
    space: (sp.getProperty('DAO_ENS_SPACE') || DAO_CFG_.DEFAULT_SPACE).trim(),
    safeAddress: (sp.getProperty('DAO_SAFE_ADDR') || '').trim(),
    chainId: Number(sp.getProperty('DAO_CHAIN_ID') || 1)
  };
}

function getDaoSpreadsheet_() {
  if (typeof getStoreSpreadsheet_ === 'function') {
    return getStoreSpreadsheet_();
  }
  var sp = PropertiesService.getScriptProperties();
  var sid = sp.getProperty('KAI_SPREADSHEET_ID');
  if (sid) return SpreadsheetApp.openById(sid);
  var ss = SpreadsheetApp.create('KantorAI-Database');
  sp.setProperty('KAI_SPREADSHEET_ID', ss.getId());
  return ss;
}

function ensureDaoSheet_() {
  var ss = getDaoSpreadsheet_();
  var sh = ss.getSheetByName(DAO_CFG_.SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(DAO_CFG_.SHEET_NAME);
    sh.appendRow([
      'proposal_id',
      'space',
      'title',
      'state',
      'author',
      'choices_json',
      'scores_json',
      'scores_total',
      'quorum',
      'quorum_reached',
      'start_iso',
      'end_iso',
      'snapshot_url',
      'synced_at'
    ]);
    sh.setFrozenRows(1);
  }
  return sh;
}

/**
 * Mengambil daftar proposal terbaru dari Snapshot GraphQL API (publik, tanpa API key).
 */
function fetchSnapshotProposals_(spaceId, limit) {
  var space = spaceId || getDaoProps_().space;
  var first = Math.min(Math.max(Number(limit || 20), 1), 50);
  var query = [
    'query Proposals($space: String!, $first: Int!) {',
    '  proposals(',
    '    first: $first,',
    '    skip: 0,',
    '    where: { space_in: [$space] },',
    '    orderBy: "created",',
    '    orderDirection: desc',
    '  ) {',
    '    id title state author choices scores scores_total quorum start end link',
    '    space { id name }',
    '  }',
    '}'
  ].join('\n');

  var res = UrlFetchApp.fetch(DAO_CFG_.ENDPOINT, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({
      query: query,
      variables: { space: space, first: first }
    })
  });

  var code = res.getResponseCode();
  var body = res.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Snapshot API HTTP ' + code + ': ' + body.slice(0, 200));
  }
  var parsed = JSON.parse(body);
  if (parsed.errors && parsed.errors.length) {
    throw new Error('Snapshot GraphQL error: ' + JSON.stringify(parsed.errors[0]));
  }
  return (parsed.data && parsed.data.proposals) ? parsed.data.proposals : [];
}

/**
 * Menyinkronkan proposal Snapshot ke tab `DAO_Proposals` + mencatat jejak audit portal.
 * Dapat dipanggil langsung dari editor Apps Script maupun lewat trigger 15 menit.
 */
function syncDaoSnapshotToPortal() {
  var cfg = getDaoProps_();
  var proposals = fetchSnapshotProposals_(cfg.space, 25);
  var sh = ensureDaoSheet_();
  var values = sh.getDataRange().getValues();
  var rowIndexById = {};
  for (var i = 1; i < values.length; i++) {
    var pid = String(values[i][0] || '').trim();
    if (pid) rowIndexById[pid] = i + 1;
  }

  var nowIso = new Date().toISOString();
  var inserted = 0;
  var updated = 0;

  proposals.forEach(function (p) {
    var total = Number(p.scores_total || 0);
    var quorum = Number(p.quorum || 0);
    var reached = quorum > 0 ? total >= quorum : total > 0;
    var row = [
      String(p.id || ''),
      cfg.space,
      String(p.title || ''),
      String(p.state || ''),
      String(p.author || ''),
      JSON.stringify(p.choices || []),
      JSON.stringify(p.scores || []),
      total,
      quorum,
      reached ? 'YA' : 'BELUM',
      p.start ? new Date(Number(p.start) * 1000).toISOString() : '',
      p.end ? new Date(Number(p.end) * 1000).toISOString() : '',
      String(p.link || ('https://snapshot.org/#/' + cfg.space + '/proposal/' + p.id)),
      nowIso
    ];
    if (rowIndexById[p.id]) {
      sh.getRange(rowIndexById[p.id], 1, 1, row.length).setValues([row]);
      updated++;
    } else {
      sh.appendRow(row);
      inserted++;
    }
  });

  if (typeof auditAppend_ === 'function') {
    try {
      auditAppend_('SYSTEM_DAO', 'Sinkronisasi Snapshot DAO (' + cfg.space + ': ' + proposals.length + ' proposal)', 'DAO', cfg.space);
    } catch (_) {}
  } else if (typeof appendAuditHash_ === 'function') {
    try {
      appendAuditHash_('SYSTEM_DAO', 'DAO_SNAPSHOT_SYNC', {
        space: cfg.space,
        total: proposals.length,
        inserted: inserted,
        updated: updated
      });
    } catch (_) {}
  }

  return {
    ok: true,
    space: cfg.space,
    safeAddress: cfg.safeAddress,
    total: proposals.length,
    inserted: inserted,
    updated: updated,
    syncedAt: nowIso
  };
}

/**
 * Membaca daftar proposal tersimpan dari Google Sheets.
 */
function listDaoProposalsFromSheet_() {
  var cfg = getDaoProps_();
  var sh = ensureDaoSheet_();
  var rows = sh.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    var choices = [];
    var scores = [];
    try { choices = JSON.parse(r[5] || '[]'); } catch (_) {}
    try { scores = JSON.parse(r[6] || '[]'); } catch (_) {}
    list.push({
      id: String(r[0]),
      space: String(r[1]),
      title: String(r[2]),
      state: String(r[3]),
      author: String(r[4]),
      choices: choices,
      scores: scores,
      scoresTotal: Number(r[7] || 0),
      quorum: Number(r[8] || 0),
      quorumReached: String(r[9]) === 'YA',
      startIso: String(r[10] || ''),
      endIso: String(r[11] || ''),
      link: String(r[12] || ''),
      syncedAt: String(r[13] || '')
    });
  }
  return {
    ok: true,
    space: cfg.space,
    safeAddress: cfg.safeAddress,
    chainId: cfg.chainId,
    proposals: list
  };
}

/**
 * Router tambahan untuk dihubungkan ke `Code_1_Core.gs` / `Code_4_RoutesC.gs` jika diinginkan:
 *   if (route === 'dao.proposals') return listDaoProposalsFromSheet_();
 *   if (route === 'dao.sync')      return syncDaoSnapshotToPortal();
 *   if (route === 'dao.config')    return { ok: true, dao: getDaoProps_() };
 */
function handleDaoHybridRoute(route, payload, session) {
  if (route === 'dao.config') {
    return { ok: true, dao: getDaoProps_() };
  }
  if (route === 'dao.proposals') {
    return listDaoProposalsFromSheet_();
  }
  if (route === 'dao.sync') {
    if (session && session.role && ['P', 'M', 'A'].indexOf(session.role) === -1) {
      return { ok: false, error: 'Hanya Pemilik/Manajer/Auditor yang dapat memicu sinkronisasi DAO.' };
    }
    return syncDaoSnapshotToPortal();
  }
  return null;
}

/**
 * Pasang trigger otomatis sinkronisasi Snapshot setiap 15 menit (jalankan 1x).
 */
function installDaoSyncTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === 'syncDaoSnapshotToPortal') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('syncDaoSnapshotToPortal')
    .timeBased()
    .everyMinutes(15)
    .create();
  return { ok: true, message: 'Trigger sinkronisasi Snapshot aktif setiap 15 menit.' };
}
