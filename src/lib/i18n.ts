import type { Lang } from "./types";

const KEY = "menu20fit_lang";

export function getLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "en" || v === "id") return v;
  } catch {
    /* ignore */
  }
  return "id";
}

export function setLang(l: Lang) {
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* ignore */
  }
}

type Dict = Record<string, { id: string; en: string }>;

const STR: Dict = {
  appName: { id: "Menu 20FIT", en: "Menu 20FIT" },
  tagline: { id: "Resep sehat — resmi & dari member", en: "Healthy recipes — official & member" },
  browse: { id: "Jelajah", en: "Browse" },
  submit: { id: "Kirim Resep", en: "Submit Recipe" },
  mySubmissions: { id: "Submission Saya", en: "My Submissions" },
  search: { id: "Cari resep…", en: "Search recipes…" },
  allCategories: { id: "Semua kategori", en: "All categories" },
  allDiets: { id: "Semua tipe diet", en: "All diet types" },
  official: { id: "Resmi 20FIT", en: "Official 20FIT" },
  member: { id: "Dari member", en: "From member" },
  login: { id: "Masuk", en: "Log in" },
  signUp: { id: "Daftar", en: "Sign up" },
  logout: { id: "Keluar", en: "Log out" },
  ingredients: { id: "Bahan", en: "Ingredients" },
  steps: { id: "Cara Buat", en: "Steps" },
  nutrition: { id: "Perkiraan Gizi", en: "Estimated Nutrition" },
  estOfficial: {
    id: "Perkiraan panduan porsi 20FIT — bukan saran ahli gizi.",
    en: "20FIT portion-guide estimate — not nutritionist advice.",
  },
  estUser: {
    id: "Perkiraan dari member yang mengirim — bukan angka terverifikasi.",
    en: "Estimate provided by the submitting member — not a verified figure.",
  },
  calories: { id: "kalori", en: "calories" },
  protein: { id: "Protein", en: "Protein" },
  carbs: { id: "Karbo", en: "Carbs" },
  fat: { id: "Lemak", en: "Fat" },
  noResults: { id: "Tidak ada resep yang cocok.", en: "No recipes match." },
  loading: { id: "Memuat…", en: "Loading…" },
  backToBrowse: { id: "← Kembali ke jelajah", en: "← Back to browse" },
  loginToSubmit: {
    id: "Masuk dulu untuk mengirim resep.",
    en: "Log in first to submit a recipe.",
  },
  reviewNote: {
    id: "Resep yang kamu kirim TIDAK langsung tayang — direview admin dulu.",
    en: "Your submitted recipe is NOT published immediately — an admin reviews it first.",
  },
  recipesWord: { id: "resep", en: "recipes" },
  loadMore: { id: "Muat lebih banyak", en: "Load more" },
  notFound: { id: "Resep tidak ditemukan.", en: "Recipe not found." },
  category: { id: "Kategori", en: "Category" },
  dietType: { id: "Tipe diet", en: "Diet type" },
  // Filter aktif (chip)
  searchPrefix: { id: "Cari", en: "Search" },
  clearAllFilters: { id: "Hapus semua", en: "Clear all" },
  removeFilterAria: { id: "Hapus filter", en: "Remove filter" },
  noResultsFiltered: {
    id: "Tidak ada resep yang cocok dengan filter ini.",
    en: "No recipes match these filters.",
  },
  // Katering (Tahap 2) -- direktori pihak ketiga, murni informasi, tanpa transaksi lewat 20FIT.
  caterersTitle: { id: "Mau beli, bukan masak sendiri?", en: "Prefer to buy instead of cook?" },
  caterersDisclaimer: {
    id: "Katering di bawah adalah mitra pihak ketiga -- transaksi langsung dengan mereka, bukan lewat 20FIT.",
    en: "The caterers below are third-party partners -- transactions happen directly with them, not through 20FIT.",
  },
  caterersVerifiedBadge: { id: "Terverifikasi", en: "Verified" },
  caterersSortNearest: { id: "Terdekat", en: "Nearest" },
  caterersSortDefault: { id: "Rekomendasi", en: "Recommended" },
  caterersLocationDenied: {
    id: "Akses lokasi ditolak/tak tersedia -- urutan kembali ke rekomendasi. Pilih area manual di bawah kalau mau.",
    en: "Location access denied/unavailable -- back to recommended order. Pick an area manually below if you'd like.",
  },
  caterersAreaAll: { id: "Semua area", en: "All areas" },
  caterersMinOrder: { id: "Min. pesan", en: "Min. order" },
  caterersOrderBtn: { id: "Pesan", en: "Order" },
  caterersWhatsappBtn: { id: "WhatsApp", en: "WhatsApp" },
  caterersDistanceKm: { id: "km", en: "km" },
  // Eat Now -- pesan-antar pihak ketiga (GrabFood dll). Bahasa JUJUR: bukan "restoran X jual ini".
  eatNowTitle: { id: "Pesan online sekarang", en: "Order online now" },
  eatNowFind: { id: "Cari", en: "Find" },
  eatNowOn: { id: "di", en: "on" },
  eatNowRedirectNote: {
    id: "Kamu akan diarahkan ke halaman kategori {provider} untuk melihat restoran di dekatmu.",
    en: "You'll be taken to the {provider} category page to see restaurants near you.",
  },
  eatNowThirdParty: {
    id: "{provider} layanan pihak ketiga -- harga & ketersediaan ditentukan oleh mereka.",
    en: "{provider} is a third-party service -- prices & availability are set by them.",
  },
  // Halaman Eat Now (Tahap 4)
  eatNowPageTitle: { id: "Pesan Sekarang", en: "Eat Now" },
  eatNowPageSub: {
    id: "Resep yang bisa langsung dipesan lewat katering mitra atau layanan pesan-antar.",
    en: "Recipes you can order right now via partner caterers or delivery services.",
  },
  eatNowEmpty: {
    id: "Belum ada resep yang bisa dipesan langsung. Nantikan ya!",
    en: "No orderable recipes yet. Check back soon!",
  },
  eatNowSearchPh: { id: "Cari makanan…", en: "Search food…" },
  eatNowAllCat: { id: "Semua kategori", en: "All categories" },
  eatNowOther: { id: "Lainnya", en: "Other" },
  // Artikel (Tahap 6)
  articlesNav: { id: "Artikel", en: "Articles" },
  articlesTitle: { id: "Artikel & Tips Sehat", en: "Healthy Articles & Tips" },
  articlesSub: {
    id: "Panduan makan sehat, gizi, diet, dan rekomendasi dari 20FIT.",
    en: "Healthy eating, nutrition, diet guides, and picks from 20FIT.",
  },
  articlesEmpty: { id: "Belum ada artikel.", en: "No articles yet." },
  articleBy: { id: "oleh", en: "by" },
  articleRelatedRecipes: { id: "Mau coba masak sendiri?", en: "Want to cook it yourself?" },
  recipeRelatedArticles: { id: "Mau makan di luar?", en: "Prefer to eat out?" },
  backToArticles: { id: "← Semua artikel", en: "← All articles" },
  seeAll: { id: "Lihat semua", en: "See all" },
  readTime: { id: "menit baca", en: "min read" },
  // Home (Tahap 5)
  homeNav: { id: "Beranda", en: "Home" },
  homeHeroTitle: { id: "Makan sehat, gampang.", en: "Healthy eating, made easy." },
  homeHeroSub: {
    id: "Resep, rekomendasi tempat makan, dan pesan langsung — dari 20FIT.",
    en: "Recipes, place recommendations, and instant ordering — from 20FIT.",
  },
  homeArticlesHeading: { id: "Artikel & Tips", en: "Articles & Tips" },
  homeHealthyHeading: { id: "Rekomendasi Makan Sehat", en: "Healthy Picks" },
  homeDietHeading: { id: "Rekomendasi Diet", en: "Diet Picks" },
  homeRecipesHeading: { id: "Resep Pilihan", en: "Featured Recipes" },
  homePlacesHeading: { id: "Rekomendasi Tempat Makan", en: "Where to Eat" },
  homeEatNowHeading: { id: "Bisa Langsung Dipesan", en: "Order Right Now" },
  browseAllRecipes: { id: "Jelajah semua resep", en: "Browse all recipes" },
  // Beranda: tempat makan via link-out GrabFood (jujur -- tanpa scraping / tanpa daftar tempat palsu).
  placesGrabTitle: { id: "Pesan dari luar via GrabFood", en: "Order out via GrabFood" },
  placesGrabDesc: {
    id: "Cari makanan di sekitarmu lewat GrabFood. Kamu akan diarahkan ke situs GrabFood (pihak ketiga).",
    en: "Find food near you on GrabFood. You'll be taken to GrabFood's site (third party).",
  },
  placesGrabBtn: { id: "Buka GrabFood", en: "Open GrabFood" },
  placesEatNowLink: { id: "Lihat resep yang bisa dipesan", en: "See recipes you can order" },
  // Atribusi pembuat resep -- resep resmi 20FIT diberi label "20FIT" saja (permintaan owner);
  // komunitas pakai nama tampilan yang diisi kontributor sendiri (BUKAN email/nama akun).
  officialKitchenName: { id: "20FIT", en: "20FIT" },
  communityFallbackName: { id: "Kontributor Komunitas", en: "Community Contributor" },
  byPrefix: { id: "oleh", en: "by" },
  displayNameLabel: { id: "Nama tampilan (publik)", en: "Display name (public)" },
  displayNameHint: {
    id: "Ditampilkan di kartu & halaman resep -- bukan nama akunmu. Kosongkan untuk tampil sebagai \"Kontributor Komunitas\".",
    en: "Shown on the card & recipe page -- not your account name. Leave blank to show as \"Community Contributor\".",
  },
  displayNamePlaceholder: { id: "mis. Dapur Bunda Rina", en: "e.g. Rina's Kitchen" },

  // Aksi & sosial
  save: { id: "Simpan", en: "Save" },
  saved: { id: "Tersimpan", en: "Saved" },
  share: { id: "Bagikan", en: "Share" },
  like: { id: "Suka", en: "Like" },
  linkCopied: { id: "Link disalin!", en: "Link copied!" },
  loginToInteract: {
    id: "Masuk atau daftar dulu, biar resep ini tersimpan permanen dan bisa kamu buka lagi kapan saja di my.20fit.id.",
    en: "Log in or sign up first, so this recipe is saved permanently and you can open it again anytime on my.20fit.id.",
  },
  savedRecipes: { id: "Resep Tersimpan", en: "Saved Recipes" },
  emptySaved: { id: "Belum ada resep tersimpan.", en: "No saved recipes yet." },
  loginToSeeSaved: {
    id: "Masuk untuk melihat koleksi resep tersimpanmu.",
    en: "Log in to see your saved collection.",
  },
  savedNotLive: {
    id: "Resep ini sedang tidak tersedia (mungkin dihapus atau belum tayang).",
    en: "This recipe is currently unavailable (removed or not published).",
  },
  // Info porsi/waktu
  servings: { id: "Porsi", en: "Servings" },
  cookTime: { id: "Masak", en: "Cook" },
  prepTime: { id: "Siap-siap", en: "Prep" },
  minutesShort: { id: "mnt", en: "min" },
  equipmentLabel: { id: "Alat yang dibutuhkan", en: "Equipment needed" },
  prepNoteLabel: { id: "Sebelum mulai masak", en: "Before you start cooking" },
  commonMistakeLabel: { id: "Kesalahan umum", en: "Common mistake" },
  // Langkah berfoto (form submit)
  step: { id: "Langkah", en: "Step" },
  addStep: { id: "+ Tambah langkah", en: "+ Add step" },
  removeStep: { id: "Hapus", en: "Remove" },
  moveUp: { id: "Naik", en: "Up" },
  moveDown: { id: "Turun", en: "Down" },
  stepTextPlaceholder: {
    id: "Tulis langkah ini…",
    en: "Describe this step…",
  },
  stepPhoto: { id: "Foto langkah", en: "Step photo" },
  addStepPhoto: { id: "+ Foto proses", en: "+ Process photo" },
  mainPhoto: { id: "Foto utama (opsional)", en: "Main photo (optional)" },
  uploading: { id: "Mengunggah…", en: "Uploading…" },
  removePhoto: { id: "hapus foto", en: "remove photo" },
  stepsHint: {
    id: "Tambahkan langkah satu per satu. Tiap langkah boleh diberi foto proses.",
    en: "Add steps one by one. Each step can have a process photo.",
  },
  // Bagikan resep
  shareTitle: { id: "Bagikan resep", en: "Share recipe" },
  copyLink: { id: "Salin", en: "Copy" },
  shareVia: { id: "Bagikan lewat", en: "Share via" },
  moreApps: { id: "Aplikasi lainnya…", en: "More apps…" },
  close: { id: "Tutup", en: "Close" },
  // Footer
  footerAbout: {
    id: "20FIT adalah ekosistem kesehatan & kebugaran terpadu — dari resep sehat, klinik olahraga, gym, sampai arena olahraga.",
    en: "20FIT is an integrated health & fitness ecosystem — from healthy recipes, a sports clinic, gym, to a sports arena.",
  },
  footerLinksTitle: { id: "Produk 20FIT lainnya", en: "More 20FIT products" },
  footerMy: { id: "Akun 20FIT", en: "20FIT Account" },
  footerClinic: { id: "20FIT Sport Clinic", en: "20FIT Sport Clinic" },
  footerGym: { id: "20FIT Gym", en: "20FIT Gym" },
  footerArena: { id: "20FIT Arena", en: "20FIT Arena" },
  footerRights: { id: "Semua hak dilindungi.", en: "All rights reserved." },
};

export function makeT(lang: Lang) {
  return (key: keyof typeof STR): string => STR[key]?.[lang] ?? String(key);
}

// Label tipe diet (set tetap; nilai mentah dipakai untuk filter, label ini untuk tampilan).
const DIET_LABELS: Record<string, { id: string; en: string }> = {
  normal: { id: "Normal", en: "Normal" },
  vegetarian: { id: "Vegetarian", en: "Vegetarian" },
  vegan: { id: "Vegan", en: "Vegan" },
  pescatarian: { id: "Pescatarian", en: "Pescatarian" },
  keto: { id: "Keto", en: "Keto" },
  halal: { id: "Halal", en: "Halal" },
  "high-protein": { id: "Tinggi Protein", en: "High-protein" },
  "low-carb": { id: "Rendah Karbo", en: "Low-carb" },
};

export function dietLabel(diet: string, lang: Lang): string {
  return DIET_LABELS[diet]?.[lang] ?? diet;
}

// Label kategori makanan (nilai mentah dari katalog dipakai untuk filter).
const CAT_LABELS: Record<string, { id: string; en: string }> = {
  Rice: { id: "Nasi", en: "Rice" },
  Chicken: { id: "Ayam", en: "Chicken" },
  Beef: { id: "Sapi", en: "Beef" },
  Seafood: { id: "Seafood", en: "Seafood" },
  Vegetarian: { id: "Vegetarian", en: "Vegetarian" },
  Vegan: { id: "Vegan", en: "Vegan" },
  Pasta: { id: "Pasta", en: "Pasta" },
  Noodle: { id: "Mie", en: "Noodle" },
};

export function catLabel(cat: string, lang: Lang): string {
  return CAT_LABELS[cat]?.[lang] ?? cat;
}

// Label status submission.
const STATUS_LABELS: Record<string, { id: string; en: string }> = {
  pending: { id: "Menunggu review", en: "Pending review" },
  approved: { id: "Disetujui", en: "Approved" },
  rejected: { id: "Ditolak", en: "Rejected" },
};

export function officialKitchenName(lang: Lang): string {
  return STR.officialKitchenName[lang];
}

export function communityFallbackName(lang: Lang): string {
  return STR.communityFallbackName[lang];
}

export function statusLabel(status: string, lang: Lang): string {
  return STATUS_LABELS[status]?.[lang] ?? status;
}
