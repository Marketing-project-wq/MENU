/*!
 * 20FIT — Universal Navigation Bar (app switcher)
 * ------------------------------------------------------------------------
 * Satu file, self-contained, VANILLA (tanpa framework). Pasang di SEMUA
 * subdomain 20FIT dengan satu baris:
 *
 *     <script src="https://recipe.20fit.id/universal-nav.js" defer></script>
 *
 * (Idealnya di-host di 20fit.id; cross-origin <script src> tetap jalan.)
 *
 * - Menyuntik bar ~44px di paling atas <body> (block biasa, BUKAN fixed/sticky —
 *   di atas navbar halaman). Semua isi & style di dalam Shadow DOM -> TIDAK
 *   bentrok dengan CSS situs manapun (React SPA, statis, WordPress).
 * - Tombol waffle (grid 9 titik) -> mega menu 3 kolom (Google-Apps style).
 * - Highlight halaman aktif ("Kamu di sini"), tutup via klik-luar/Escape/scroll,
 *   klik item = full-page redirect (beda subdomain).
 * - Ikon = line-icon konsisten (bukan emoji). Ubah menu = edit MENU_ITEMS saja.
 */
(function () {
  "use strict";
  if (window.__uniNav20fit) return; // cegah dobel-inject kalau ke-load 2x
  window.__uniNav20fit = true;

  /* ------------------------------- DATA -------------------------------- */
  var MENU_ITEMS = [
    { id: "home",    label: "Home",            description: "Direktori Olahraga",       icon: "home",    url: "https://20fit.id",                  color: "#111827" },
    { id: "my20fit", label: "My 20FIT",        description: "Member Portal",            icon: "user",    url: "https://my.20fit.id",               color: "#6366F1" },
    { id: "recipe",  label: "Recipe",          description: "Menu & Resep Sehat",       icon: "recipe",  url: "https://recipe.20fit.id",           color: "#16A34A" },
    { id: "calorie", label: "Calorie Tracker", description: "Hitung Kalori Harian",     icon: "flame",   url: "https://calorietracker.20fit.id",   color: "#F97316" },
    { id: "mcu",     label: "MCU Scanner",     description: "Baca Hasil Medical Check", icon: "pulse",   url: "https://medicalscanner.20fit.id",   color: "#0EA5E9" },
    { id: "media",   label: "Media",           description: "Blog & Artikel",           icon: "media",   url: "https://media.20fit.id",            color: "#8B5CF6" },
    { id: "workout", label: "Workout",         description: "Streaming Latihan",        icon: "workout", url: "https://workout.20fit.id",          color: "#EF4444" },
    { id: "photo",   label: "Photo",           description: "Foto Event",               icon: "camera",  url: "https://photo.20fit.id",            color: "#EC4899" },
    { id: "ticket",  label: "Ticket",          description: "Tiket & Booking",          icon: "ticket",  url: "https://ticket.20fit.id",           color: "#14B8A6" },
    { id: "talent",  label: "Talent",          description: "Talent & Event Organizer", icon: "users",   url: "https://talent.20fit.id",           color: "#3B82F6" },
  ];

  var HOST_MAP = {
    "20fit.id": "home", "www.20fit.id": "home",
    "my.20fit.id": "my20fit",
    "recipe.20fit.id": "recipe", "recepie.20fit.id": "recipe",
    "calorietracker.20fit.id": "calorie",
    "medicalscanner.20fit.id": "mcu",
    "media.20fit.id": "media",
    "workout.20fit.id": "workout",
    "photo.20fit.id": "photo",
    "ticket.20fit.id": "ticket",
    "talent.20fit.id": "talent",
  };

  // Deteksi app aktif dari hostname. `window.__UNINAV_APP__` = override manual
  // (buat preview/testing, mis. set "recipe" untuk simulasi halaman recipe).
  var currentApp = window.__UNINAV_APP__ || HOST_MAP[location.hostname] || null;
  var currentLabel = (function () {
    for (var i = 0; i < MENU_ITEMS.length; i++) if (MENU_ITEMS[i].id === currentApp) return MENU_ITEMS[i].label;
    return "";
  })();

  /* ------------------------------- IKON -------------------------------- */
  // Line-icon konsisten (stroke, viewBox 24). Satu gaya untuk semua.
  var ICON_PATHS = {
    home:    '<path d="M3 10.6 12 4l9 6.6"/><path d="M5.5 9.4V20h13V9.4"/><path d="M10 20v-5h4v5"/>',
    user:    '<circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6"/>',
    recipe:  '<path d="M6 3v6a2 2 0 0 0 4 0V3"/><path d="M8 11v10"/><path d="M16.5 3c-1.6 1.2-2.6 3.3-2.6 6 0 2 1.2 2.9 2.6 2.9V21"/>',
    flame:   '<path d="M12 3c.8 3 4 4.4 4 8a4 4 0 1 1-8 0c0-1.6.7-2.7 1.5-3.5C10 8 10.7 6 12 3Z"/><path d="M12 20a2.2 2.2 0 0 1-2.2-2.2c0-1.3 1-2 2.2-3.3 1.2 1.3 2.2 2 2.2 3.3A2.2 2.2 0 0 1 12 20Z"/>',
    pulse:   '<path d="M3.5 13.5h3l1.6-4.5 3 9 2.2-6 1.3 2.3H21"/><path d="M20.5 9.2A3.7 3.7 0 0 0 14 6.8 3.7 3.7 0 0 0 7.5 8.4"/>',
    media:   '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M7 9h7M7 12h7M7 15h4.5"/><rect x="15.5" y="12" width="2.6" height="3.2" rx="0.5"/>',
    workout: '<path d="M6.5 8v8M4 9.5v5M17.5 8v8M20 9.5v5"/><path d="M6.5 12h11"/>',
    camera:  '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.2 7l1.4-2.4h4.8L15.8 7"/><circle cx="12" cy="13.6" r="3.2"/>',
    ticket:  '<path d="M4 9V7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V9a2 2 0 0 0 0 4v1.5A1.5 1.5 0 0 1 18.5 16h-13A1.5 1.5 0 0 1 4 14.5V13a2 2 0 0 0 0-4Z"/><path d="M14 6.5v11" stroke-dasharray="2 2.4"/>',
    users:   '<circle cx="9.2" cy="8" r="3"/><path d="M3.4 20c0-3.1 2.7-5 5.8-5s5.8 1.9 5.8 5"/><path d="M16.5 5.4a3 3 0 0 1 0 5.5"/><path d="M17.8 15.2c2 .6 3.4 2.1 3.4 4.4"/>',
  };
  function iconSVG(key, color) {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON_PATHS[key] || "") + "</svg>"
    );
  }
  var WAFFLE =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    "<circle cx='6' cy='6' r='1.6'/><circle cx='12' cy='6' r='1.6'/><circle cx='18' cy='6' r='1.6'/>" +
    "<circle cx='6' cy='12' r='1.6'/><circle cx='12' cy='12' r='1.6'/><circle cx='18' cy='12' r='1.6'/>" +
    "<circle cx='6' cy='18' r='1.6'/><circle cx='12' cy='18' r='1.6'/><circle cx='18' cy='18' r='1.6'/></svg>";
  var CLOSE_X =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  /* ------------------------------ STYLE -------------------------------- */
  var CSS =
    ":host{all:initial}" +
    "*{box-sizing:border-box;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}" +
    // Bar
    ".bar{display:flex;align-items:center;gap:12px;height:44px;padding:0 14px;background:#111111;color:#fff}" +
    ".logo{display:inline-flex;align-items:center;gap:6px;color:#fff;text-decoration:none;font-weight:800;font-size:15px;letter-spacing:.5px}" +
    ".logo b{color:#EF4444}" +
    ".label{flex:1;text-align:center;font-size:13px;color:rgba(255,255,255,.72);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".waffle{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;padding:6px;border:0;border-radius:9px;background:transparent;color:#fff;cursor:pointer;transition:background .15s}" +
    ".waffle:hover{background:rgba(255,255,255,.12)}" +
    ".waffle[aria-expanded='true']{background:rgba(255,255,255,.18)}" +
    ".waffle svg{width:20px;height:20px}" +
    // Scrim (mobile)
    ".scrim{position:fixed;inset:0;background:rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .15s;z-index:2147483646}" +
    ".open .scrim{opacity:1;pointer-events:auto}" +
    // Menu (desktop: dropdown kanan-atas)
    ".menu{position:absolute;top:44px;right:8px;width:min(460px,94vw);max-height:calc(100vh - 60px);overflow:auto;background:#fff;color:#111;border-radius:0 0 16px 16px;box-shadow:0 14px 40px rgba(0,0,0,.18);padding:14px;opacity:0;transform:translateY(-8px);pointer-events:none;transition:opacity .2s ease,transform .2s ease;z-index:2147483647}" +
    ".open .menu{opacity:1;transform:translateY(0);pointer-events:auto}" +
    ".grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}" +
    ".mhead{display:none}" +
    // Card
    ".card{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;padding:14px 6px;border-radius:12px;border:2px solid transparent;text-decoration:none;color:#1a1a1a;cursor:pointer;transition:background .15s,border-color .15s}" +
    ".card:hover{background:#f4f4f5}" +
    ".card:focus-visible{outline:2px solid #111;outline-offset:2px}" +
    ".card .ic{width:34px;height:34px;display:flex;align-items:center;justify-content:center;margin-bottom:2px}" +
    ".card .ic svg{width:28px;height:28px}" +
    ".card .t{font-size:12px;font-weight:700;line-height:1.2}" +
    ".card .d{font-size:10px;color:#8a8a8a;line-height:1.2;margin-top:1px}" +
    ".card.active{background:#f2f2f2;border-color:#111;cursor:default}" +
    ".card .here{font-size:9px;font-weight:700;color:#16A34A;margin-top:3px}" +
    // Mobile: fullscreen overlay, 2 kolom
    "@media (max-width:639px){" +
    ".menu{position:fixed;inset:0;top:0;right:0;width:100vw;max-height:none;height:100dvh;border-radius:0;padding:14px;transform:translateY(0) scale(.98)}" +
    ".open .menu{transform:none}" +
    ".mhead{display:flex;align-items:center;justify-content:space-between;margin:2px 2px 14px}" +
    ".mhead .mt{font-weight:800;font-size:16px}" +
    ".mclose{display:inline-flex;width:38px;height:38px;padding:8px;border:0;border-radius:10px;background:#f1f1f1;color:#111;cursor:pointer}" +
    ".grid{grid-template-columns:repeat(2,1fr);gap:8px}" +
    ".card{padding:18px 8px}" +
    ".card .ic svg{width:26px;height:26px}" +
    "}" +
    // Tablet: menu sedikit lebih lebar
    "@media (min-width:640px) and (max-width:1023px){.menu{width:min(560px,92vw)}}" +
    "@media (prefers-reduced-motion:reduce){.menu,.scrim{transition:none}}";

  /* ------------------------------ BUILD -------------------------------- */
  var host = document.createElement("div");
  host.id = "universal-nav-20fit";
  host.style.cssText = "all:initial;display:block";
  var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

  var cardsHTML = MENU_ITEMS.map(function (it) {
    var active = it.id === currentApp;
    return (
      '<a class="card' + (active ? " active" : "") + '" role="link" ' +
      'href="' + (active ? "#" : it.url) + '"' + (active ? ' aria-current="page"' : "") + ' data-active="' + active + '">' +
      '<span class="ic">' + iconSVG(it.icon, it.color) + "</span>" +
      '<span class="t">' + it.label + "</span>" +
      '<span class="d">' + it.description + "</span>" +
      (active ? '<span class="here">● Kamu di sini</span>' : "") +
      "</a>"
    );
  }).join("");

  root.innerHTML =
    "<style>" + CSS + "</style>" +
    '<div class="wrap">' +
    '<div class="bar">' +
    '<a class="logo" href="https://20fit.id" aria-label="20FIT — beranda">20<b>FIT</b></a>' +
    '<span class="label">' + currentLabel + "</span>" +
    '<button class="waffle" type="button" aria-label="Menu aplikasi 20FIT" aria-haspopup="true" aria-expanded="false">' + WAFFLE + "</button>" +
    "</div>" +
    '<div class="scrim" data-close="1"></div>' +
    '<nav class="menu" aria-label="Aplikasi 20FIT">' +
    '<div class="mhead"><span class="mt">Aplikasi 20FIT</span><button class="mclose" type="button" aria-label="Tutup menu">' + CLOSE_X + "</button></div>" +
    '<div class="grid">' + cardsHTML + "</div>" +
    "</nav>" +
    "</div>";

  // Sisipkan di paling atas <body> (di atas navbar halaman).
  function mount() {
    if (document.body.firstChild) document.body.insertBefore(host, document.body.firstChild);
    else document.body.appendChild(host);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);

  /* ---------------------------- BEHAVIOR ------------------------------- */
  var wrap = root.querySelector(".wrap");
  var waffle = root.querySelector(".waffle");
  var menu = root.querySelector(".menu");
  var isOpen = false;

  function setOpen(v) {
    isOpen = v;
    wrap.classList.toggle("open", v);
    waffle.setAttribute("aria-expanded", v ? "true" : "false");
    if (v) {
      var first = menu.querySelector(".card");
      if (first) first.focus();
    } else {
      waffle.focus();
    }
  }

  waffle.addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(!isOpen);
  });

  // Klik item: aktif -> jangan pindah; lainnya -> full-page redirect.
  root.querySelectorAll(".card").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (a.getAttribute("data-active") === "true") {
        e.preventDefault();
        setOpen(false);
      } else {
        // biarkan href jalan (full page redirect antar subdomain)
        setOpen(false);
      }
    });
  });

  // Tombol close (mobile) + scrim.
  root.querySelectorAll(".mclose,[data-close]").forEach(function (el) {
    el.addEventListener("click", function () { setOpen(false); });
  });

  // Klik di luar bar/menu -> tutup. (Klik di dalam shadow ter-retarget ke host.)
  document.addEventListener("click", function (e) {
    if (isOpen && e.target !== host) setOpen(false);
  });

  // Escape -> tutup.
  document.addEventListener("keydown", function (e) {
    if (isOpen && (e.key === "Escape" || e.key === "Esc")) setOpen(false);
  });

  // Scroll halaman saat menu terbuka -> tutup (kecuali scroll di dalam menu sendiri).
  window.addEventListener(
    "scroll",
    function () { if (isOpen) setOpen(false); },
    { passive: true }
  );
})();
