/**
 * REKAP RSVP UNDANGAN -> GOOGLE SPREADSHEET
 * Tempel seluruh kode ini di: Spreadsheet > Ekstensi > Apps Script
 * Lalu Deploy > New deployment > Web app
 *   - Execute as : Me (saya)
 *   - Who has access : Anyone (Siapa saja)
 * Salin URL Web App (berakhiran /exec) ke CONFIG.scriptUrl di undangan-adat.html
 */
const SHEET_RSVP = "RSVP";
const SHEET_REKAP = "Rekap";

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_RSVP);
  if (!sh) sh = ss.insertSheet(SHEET_RSVP);
  if (sh.getLastRow() === 0) {
    sh.appendRow(["Waktu", "Nama", "Status", "Jumlah", "Ucapan"]);
    sh.setFrozenRows(1);
    sh.getRange("A1:E1").setFontWeight("bold").setBackground("#6E4128").setFontColor("#ffffff");
    sh.setColumnWidth(2, 180); sh.setColumnWidth(5, 360);
  }
  if (!ss.getSheetByName(SHEET_REKAP)) {
    const r = ss.insertSheet(SHEET_REKAP);
    r.getRange("A1:B4").setValues([
      ["Total respon", "=COUNTA(RSVP!B2:B)"],
      ["Konfirmasi hadir", '=COUNTIF(RSVP!C2:C,"Hadir")'],
      ["Tidak hadir", '=COUNTIF(RSVP!C2:C,"Tidak hadir")'],
      ["Total tamu hadir (orang)", "=SUM(RSVP!D2:D)"]
    ]);
    r.getRange("A1:A4").setFontWeight("bold");
    r.setColumnWidth(1, 200);
  }
  return sh;
}

// Cegah teks diawali = + - @ dibaca sebagai rumus
function clean_(v, max) {
  return String(v == null ? "" : v).trim().slice(0, max).replace(/^[=+\-@]/, "'$&");
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Menerima kiriman form RSVP
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const nama = clean_(d.nama, 80);
    if (!nama) return json_({ ok: false, error: "Nama kosong" });
    const status = d.status === "Hadir" ? "Hadir" : "Tidak hadir";
    const jumlah = status === "Hadir" ? Math.max(1, Math.min(10, parseInt(d.jumlah, 10) || 1)) : 0;
    getSheet_().appendRow([new Date(), nama, status, jumlah, clean_(d.ucapan, 300)]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Mengirim daftar ucapan (terbaru di atas) untuk ditampilkan di undangan
function doGet() {
  const sh = getSheet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return json_([]);
  const rows = sh.getRange(2, 1, n, 5).getDisplayValues();
  const list = rows
    .filter(r => r[4])
    .reverse()
    .slice(0, 100)
    .map(r => ({ nama: r[1], status: r[2], ucapan: r[4], waktu: r[0] }));
  return json_(list);
}
