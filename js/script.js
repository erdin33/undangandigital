/* ===== UBAH BAGIAN INI ===== */
const CONFIG = {
  scriptUrl: "GANTI_DENGAN_URL_WEB_APP_APPS_SCRIPT",  // URL Web App Google Apps Script (berakhiran /exec)
  tanggalAcara: "2026-12-20T09:00:00+07:00",          // mulai acara (untuk hitung mundur)
  durasiJam: 5,                                       // untuk Save The Date
  judulKalender: "Pernikahan Raka & Sinta",
  lokasi: "Jl. Contoh No. 12, Jakarta",
  maksTamu: 4,
  musik: "musik/lagu.mp3"   // file mp3 di folder musik/, atau link langsung ke file .mp3
};
/* =========================== */

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
const wait = ms => new Promise(r => setTimeout(r, ms));
root.classList.add("js");
history.scrollRestoration = "manual"; scrollTo(0, 0);

/* ---------- Hiasan bunga di sudut bagian bertanda .fl ---------- */
const corner = cls => `<svg class="corner ${cls}" viewBox="0 0 200 170" aria-hidden="true">
<path d="M0 62C70 70 110 110 160 168M92 0C100 40 130 70 196 88" fill="none" stroke="currentColor" stroke-width="1.6"/>
<use href="#lf" x="56" y="78" width="16" height="32" transform="rotate(-50 64 94)"/><use href="#lf" x="110" y="108" width="16" height="32" transform="rotate(-20 118 124)"/>
<use href="#lf" x="118" y="50" width="14" height="28" transform="rotate(35 125 64)"/><use href="#lf" x="160" y="76" width="14" height="28" transform="rotate(60 167 90)"/>
<use href="#fl" x="-25" y="-25" width="115" height="115"/><use href="#fl" x="62" y="-14" width="70" height="70"/>
<use href="#fl" x="-12" y="72" width="72" height="72"/><use href="#fl" x="118" y="-26" width="48" height="48"/>
<use href="#fl" x="52" y="66" width="38" height="38"/></svg>`;
$$(".fl").forEach(s => s.insertAdjacentHTML("afterbegin", corner("") + corner("r")));

/* ---------- Cincin bunga di monogram sampul ---------- */
document.querySelector(".cover .ring").innerHTML =
  `<circle r="146" fill="none" stroke="currentColor" stroke-dasharray="2 6"/><circle r="112" fill="none" stroke="currentColor" stroke-opacity=".6"/>` +
  [...Array(12)].map((_, i) => `<use href="#fl" x="-13" y="-139" width="26" height="26" transform="rotate(${i * 30})"/>`).join("");

/* ---------- Kelopak jatuh di sampul ---------- */
if (!reduce) {
  const box = document.querySelector(".petals");
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("span"); p.className = "petal";
    p.style.cssText = `left:${Math.random() * 100}%;animation-duration:${9 + Math.random() * 9}s;animation-delay:-${Math.random() * 14}s;--s:${.6 + Math.random() * .8};--x:${(Math.random() * 120 - 60) | 0}px`;
    box.append(p);
  }
}

/* ---------- Nama tamu dari link: ?to=Budi+Santoso ---------- */
const to = (new URLSearchParams(location.search).get("to") || "").trim().slice(0, 80);
if (to) { $("guestName").textContent = to; $("nama").value = to; }

/* ---------- Save The Date (Google Calendar) ---------- */
const start = new Date(CONFIG.tanggalAcara), end = new Date(+start + CONFIG.durasiJam * 36e5);
const fmt = d => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
$("cal").href = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" +
  encodeURIComponent(CONFIG.judulKalender) + "&dates=" + fmt(start) + "/" + fmt(end) +
  "&location=" + encodeURIComponent(CONFIG.lokasi);

/* ---------- Hitung mundur ---------- */
const cells = $$("#count strong");
function tick() {
  const d = start - Date.now();
  if (d <= 0) { $("count").className = "count done"; $("count").textContent = "Hari bahagia telah tiba"; clearInterval(timer); return; }
  [[864e5, 1e9], [36e5, 24], [6e4, 60], [1e3, 60]].forEach(([ms, m], i) =>
    cells[i].textContent = String(Math.floor(d / ms) % m).padStart(2, "0"));
}
const timer = setInterval(tick, 1000); tick();

/* ---------- Musik latar ---------- */
const bgm = $("bgm"), mb = $("music");
const setPlay = on => mb.classList.toggle("on", on);
function playMusic() {
  if (!CONFIG.musik || !bgm.paused) return;
  bgm.play().then(() => { setPlay(true); mb.classList.remove("hide"); }).catch(() => {});
}
if (CONFIG.musik) {
  bgm.src = CONFIG.musik;
  bgm.addEventListener("loadedmetadata", () => mb.classList.remove("hide"));
  bgm.addEventListener("error", () => mb.classList.add("hide"));   // file belum ada -> tombol disembunyikan
}
mb.onclick = () => bgm.paused ? playMusic() : (bgm.pause(), setPlay(false));
// jeda saat aplikasi/tab ditinggalkan, lanjut lagi saat kembali
let wasPlaying = false;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { wasPlaying = !bgm.paused; bgm.pause(); setPlay(false); }
  else if (wasPlaying) playMusic();
});

/* ---------- Buka undangan: sampul bergeser ke atas ---------- */
$("open").addEventListener("click", async () => {
  playMusic();                       // dipanggil langsung saat klik agar diizinkan browser HP
  const cover = $("cover");
  document.body.classList.remove("locked");
  scrollTo(0, 0);
  cover.classList.add("opened");
  await wait(reduce ? 0 : 500);
  $$("#beranda [data-anim]").forEach(el => el.classList.add("in"));
  await wait(reduce ? 0 : 600);
  cover.classList.add("gone");
  $("nav").classList.add("show");
});

/* ---------- Transisi tirai antar halaman ---------- */
const veil = $("veil");
let busy = false;
function jump(el) {
  root.style.scrollBehavior = "auto";
  el.scrollIntoView({ behavior: "instant", block: "start" });
  root.style.scrollBehavior = "";
}
async function go(el) {
  if (busy || !el) return;
  if (reduce) { jump(el); return; }
  busy = true;
  veil.classList.add("on"); await wait(750);
  jump(el); await wait(250);
  veil.classList.remove("on"); await wait(650);
  busy = false;
}

/* ---------- Navigasi bawah + penanda halaman aktif ---------- */
$$("#nav a").forEach(a => a.addEventListener("click", e => {
  e.preventDefault(); go(document.querySelector(a.getAttribute("href")));
}));
const navIO = new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return;
  const key = en.target.dataset.nav;
  $$("#nav a").forEach(a => a.classList.toggle("act", a.dataset.go === key));
}), { rootMargin: "-45% 0px -50% 0px" });
$$("section[data-nav]").forEach(s => navIO.observe(s));

/* ---------- Animasi muncul saat scroll ---------- */
const io = new IntersectionObserver(es => es.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
}), { threshold: .12, rootMargin: "0px 0px -6% 0px" });
$$(".sec").forEach(sec => sec.querySelectorAll("[data-anim]").forEach((el, i) => {
  el.style.setProperty("--d", Math.min(i, 4) * .1 + "s");
  if (!sec.matches("#beranda")) io.observe(el);   // beranda dimunculkan setelah sampul dibuka
}));

/* ---------- Galeri + lightbox (bisa geser di HP) ---------- */
const gItems = [...$$(".g-item img")], lb = $("lb"), lbImg = $("lbImg");
let gi = 0;
function showImg(i) {
  gi = (i + gItems.length) % gItems.length;
  lbImg.src = gItems[gi].src; lbImg.alt = gItems[gi].alt;
  lbImg.style.animation = "none"; lbImg.offsetWidth; lbImg.style.animation = "";
}
const closeLb = () => { lb.classList.add("hide"); document.body.style.overflow = ""; };
$$(".g-item").forEach((b, i) => b.addEventListener("click", () => {
  showImg(i); lb.classList.remove("hide"); document.body.style.overflow = "hidden";
  lb.querySelector(".lb-close").focus();
}));
lb.querySelector(".lb-close").onclick = closeLb;
lb.querySelector(".lb-prev").onclick = () => showImg(gi - 1);
lb.querySelector(".lb-next").onclick = () => showImg(gi + 1);
lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
document.addEventListener("keydown", e => {
  if (lb.classList.contains("hide")) return;
  if (e.key === "Escape") closeLb();
  if (e.key === "ArrowLeft") showImg(gi - 1);
  if (e.key === "ArrowRight") showImg(gi + 1);
});
let tx = 0;
lb.addEventListener("touchstart", e => tx = e.touches[0].clientX, { passive: true });
lb.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) > 50) showImg(gi + (dx < 0 ? 1 : -1));
});

/* ---------- Tab Wedding Gift ---------- */
$$(".tab").forEach(t => t.addEventListener("click", () => {
  $$(".tab").forEach(x => { x.classList.toggle("act", x === t); x.setAttribute("aria-selected", x === t); });
  $$(".tab-panel").forEach(p => p.classList.toggle("hide", p.id !== t.dataset.tab));
  $$("#" + t.dataset.tab + " [data-anim]").forEach(el => el.classList.add("in"));
}));

/* ---------- Salin no. rekening / alamat ---------- */
function toast(text) {
  const t = $("toast"); t.textContent = text; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2000);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0"; document.body.append(ta); ta.select();
    const ok = document.execCommand("copy"); ta.remove(); return ok;
  }
}
$$("[data-copy]").forEach(b => b.addEventListener("click", async () =>
  toast(await copyText(b.dataset.copy) ? "Berhasil disalin ✓" : "Gagal menyalin")));

/* ---------- Form RSVP ---------- */
for (let i = 1; i <= CONFIG.maksTamu; i++) $("jumlah").add(new Option(i + " orang", i));
$$('input[name="status"]').forEach(r =>
  r.addEventListener("change", () => $("jumlahWrap").classList.toggle("hide", r.checked && r.value === "Tidak hadir")));

/* ---------- Daftar ucapan dari spreadsheet ---------- */
function wishEl(w) {
  const el = document.createElement("div"); el.className = "wish";
  const av = document.createElement("span"); av.className = "avatar"; av.textContent = (w.nama || "?").trim().charAt(0).toUpperCase();
  const body = document.createElement("div");
  const b = document.createElement("b"); b.textContent = w.nama;
  if (w.status) { const s = document.createElement("em"); s.textContent = w.status; b.append(s); }
  const p = document.createElement("p"); p.textContent = w.ucapan;
  body.append(b, p);
  if (w.waktu) { const t = document.createElement("time"); t.textContent = w.waktu; body.append(t); }
  el.append(av, body); return el;
}
function renderWishes(list) {
  $("wishCount").textContent = list.length;
  if (!list.length) return;
  $("wishes").textContent = "";
  list.forEach(w => $("wishes").appendChild(wishEl(w)));
}
async function loadWishes() {
  if (CONFIG.scriptUrl.startsWith("GANTI")) return;
  try { renderWishes(await (await fetch(CONFIG.scriptUrl)).json()); } catch (e) {}
}
loadWishes();

/* ---------- Kirim RSVP ke spreadsheet ---------- */
$("form").addEventListener("submit", async e => {
  e.preventDefault();
  const msg = $("msg"), btn = $("send");
  if (CONFIG.scriptUrl.startsWith("GANTI")) { msg.textContent = "URL Apps Script belum diisi di js/script.js"; return; }
  const f = new FormData(e.target), hadir = f.get("status") === "Hadir";
  const data = { nama: f.get("nama").trim(), status: f.get("status"),
    jumlah: hadir ? Number(f.get("jumlah")) : 0, ucapan: f.get("ucapan").trim() };
  btn.disabled = true; msg.textContent = "Mengirim...";
  try {
    await fetch(CONFIG.scriptUrl, { method: "POST", mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) });
    msg.textContent = "Terima kasih, konfirmasi Anda sudah terkirim.";
    if (data.ucapan) {   // tampilkan langsung tanpa menunggu spreadsheet
      if (!$("wishes").querySelector(".wish")) $("wishes").textContent = "";
      $("wishes").prepend(wishEl({ ...data, waktu: "Baru saja" }));
      $("wishCount").textContent = $("wishes").querySelectorAll(".wish").length;
    }
    e.target.reset(); if (to) $("nama").value = to;
    $("jumlahWrap").classList.remove("hide");
    setTimeout(loadWishes, 3000);
  } catch (err) { msg.textContent = "Gagal mengirim. Periksa koneksi lalu coba lagi."; }
  btn.disabled = false;
});
