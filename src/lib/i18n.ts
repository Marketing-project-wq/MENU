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
  browse: { id: "Resep", en: "Recipe" },
  submit: { id: "Kirim Resep", en: "Submit Recipe" },
  mySubmissions: { id: "Submission Saya", en: "My Submissions" },
  search: { id: "Cari resep…", en: "Search recipes…" },
  allCategories: { id: "Semua kategori", en: "All categories" },
  allDiets: { id: "Semua tipe diet", en: "All diet types" },
  allCalories: { id: "Semua kalori", en: "All calories" },
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
  fiber: { id: "Serat", en: "Fiber" },
  sugar: { id: "Gula", en: "Sugar" },
  sodium: { id: "Natrium", en: "Sodium" },
  noResults: { id: "Tidak ada resep yang cocok.", en: "No recipes match." },
  loading: { id: "Memuat…", en: "Loading…" },
  backToBrowse: { id: "Kembali ke resep", en: "Back to recipes" },
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
    id: "Semua menu 20FIT — tekan \"Eat Now\" untuk cari yang mirip di GrabFood.",
    en: "All 20FIT menus — tap \"Eat Now\" to find something similar on GrabFood.",
  },
  eatNowEmpty: {
    id: "Belum ada resep yang bisa dipesan langsung. Nantikan ya!",
    en: "No orderable recipes yet. Check back soon!",
  },
  eatNowSearchPh: { id: "Cari makanan…", en: "Search food…" },
  eatNowAllCat: { id: "Semua kategori", en: "All categories" },
  eatNowOther: { id: "Lainnya", en: "Other" },
  eatNowBtn: { id: "Eat Now", en: "Eat Now" },
  eatNowGrabHint: {
    id: "Buka kategori GrabFood yang relevan — kamu diarahkan ke situs Grab (pihak ketiga).",
    en: "Opens the related GrabFood category — you'll be taken to Grab's site (third party).",
  },
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
  backToArticles: { id: "Semua artikel", en: "All articles" },
  seeAll: { id: "Lihat semua", en: "See all" },
  readTime: { id: "menit baca", en: "min read" },
  // Home (Tahap 5)
  homeNav: { id: "Beranda", en: "Home" },
  homeHeroTitle: { id: "Mau makan apa hari ini?", en: "What are you going to eat today?" },
  homeArticlesHeading: { id: "Artikel & Tips", en: "Articles & Tips" },
  homeTopArticlesHeading: { id: "5 Artikel untuk Dibaca Hari Ini", en: "Top 5 Articles to Read Today" },
  homeHealthyHeading: { id: "Rekomendasi Makan Sehat", en: "Healthy Picks" },
  homeDietHeading: { id: "Rekomendasi Diet", en: "Diet Picks" },
  homeRecipesHeading: { id: "Resep Pilihan", en: "Featured Recipes" },
  homeFavoritesHeading: { id: "Resep Favorit", en: "Favorite Recipes" },
  homeFavoritesSub: { id: "Pilihan resep populer dari dapur 20FIT.", en: "Popular picks from the 20FIT kitchen." },
  homeTopArticlesSub: {
    id: "Tips gizi, diet, dan makan sehat — terbaru dari redaksi 20FIT.",
    en: "Nutrition, diet, and healthy-eating tips — fresh from the 20FIT team.",
  },
  homeHealthySub: {
    id: "Resep nabati & ringan untuk makan lebih sehat tiap hari.",
    en: "Plant-based & light recipes to eat healthier every day.",
  },
  homeDietSub: {
    id: "Resep tinggi protein, keto, dan rendah karbo untuk target dietmu.",
    en: "High-protein, keto, and low-carb recipes for your diet goals.",
  },
  homePlacesSub: {
    id: "Belum sempat masak? Pesan makanan mirip lewat GrabFood.",
    en: "No time to cook? Order something similar via GrabFood.",
  },
  homePlacesHeading: { id: "Rekomendasi Tempat Makan", en: "Where to Eat" },
  homeEatNowHeading: { id: "Bisa Langsung Dipesan", en: "Order Right Now" },
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
    id: "Masuk atau daftar dulu, biar resep ini tersimpan permanen dan bisa kamu buka lagi kapan saja di akun 20FIT-mu.",
    en: "Log in or sign up first, so this recipe is saved permanently and you can open it again anytime with your 20FIT account.",
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
  // Kontrol porsi (F1) -- skala ANGKA gizi saja; teks bahan sengaja TIDAK ikut diskalakan otomatis.
  portionControlLabel: { id: "Mau makan berapa porsi?", en: "How many servings?" },
  decreasePortions: { id: "Kurangi porsi", en: "Decrease servings" },
  increasePortions: { id: "Tambah porsi", en: "Increase servings" },
  estimateForPortions: { id: "untuk {n} porsi (perkiraan)", en: "for {n} serving(s) (estimate)" },
  ingredientsScaleBadge: { id: "×{n} dari resep asli", en: "×{n} of the original recipe" },
  ingredientsScaleNote: {
    id: "Jumlah bahan di bawah TIDAK ikut disesuaikan otomatis — sesuaikan sendiri sesuai kelipatan di atas.",
    en: "The ingredient amounts below are NOT scaled automatically — adjust them yourself using the multiplier above.",
  },
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

  // Auth in-place (daftar/masuk langsung di recepie.20fit.id — tanpa lompat ke my.20fit.id).
  authSignInTitle: { id: "Masuk", en: "Log in" },
  authSignUpTitle: { id: "Daftar akun 20FIT", en: "Create your 20FIT account" },
  authWelcome: {
    id: "Simpan resep, kirim resep, dan kelola koleksimu — langsung di sini dengan akun 20FIT.",
    en: "Save recipes, submit recipes, and manage your collection — right here with a 20FIT account.",
  },
  authEmail: { id: "Email", en: "Email" },
  authPassword: { id: "Password", en: "Password" },
  authName: { id: "Nama (opsional)", en: "Name (optional)" },
  authNamePlaceholder: { id: "mis. Rina", en: "e.g. Rina" },
  authShowPw: { id: "Lihat", en: "Show" },
  authHidePw: { id: "Sembunyikan", en: "Hide" },
  authSignInBtn: { id: "Masuk", en: "Log in" },
  authSignUpBtn: { id: "Daftar", en: "Sign up" },
  authProcessing: { id: "Memproses…", en: "Processing…" },
  authToSignUp: { id: "Belum punya akun? Daftar", en: "No account yet? Sign up" },
  authToSignIn: { id: "Sudah punya akun? Masuk", en: "Already have an account? Log in" },
  authForgot: { id: "Lupa password?", en: "Forgot password?" },
  authResetTitle: { id: "Reset password", en: "Reset password" },
  authResetIntro: {
    id: "Masukkan email akunmu. Kami kirim link untuk atur ulang password.",
    en: "Enter your account email. We'll send a link to reset your password.",
  },
  authResetBtn: { id: "Kirim link reset", en: "Send reset link" },
  authResetSent: {
    id: "Kalau email itu terdaftar, link reset sudah dikirim. Cek inbox (dan folder spam).",
    en: "If that email is registered, a reset link has been sent. Check your inbox (and spam).",
  },
  authBackToSignIn: { id: "Kembali ke Masuk", en: "Back to log in" },
  authNewPasswordTitle: { id: "Buat password baru", en: "Set a new password" },
  authNewPassword: { id: "Password baru", en: "New password" },
  authUpdatePwBtn: { id: "Simpan password", en: "Save password" },
  authPwUpdated: {
    id: "Password diperbarui. Kamu sudah masuk.",
    en: "Password updated. You're now logged in.",
  },
  authConfirmSent: {
    id: "Akun dibuat! Cek email untuk konfirmasi, lalu masuk.",
    en: "Account created! Check your email to confirm, then log in.",
  },
  authPwMin: { id: "Password minimal 6 karakter.", en: "Password must be at least 6 characters." },
  authEmailInvalid: { id: "Masukkan email yang valid.", en: "Enter a valid email address." },
  authErrInvalidLogin: { id: "Email atau password salah.", en: "Wrong email or password." },
  authErrExists: {
    id: "Email ini sudah terdaftar. Coba masuk.",
    en: "This email is already registered. Try logging in.",
  },
  authErrGeneric: { id: "Terjadi kesalahan. Coba lagi.", en: "Something went wrong. Please try again." },
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
  Fish: { id: "Ikan", en: "Fish" },
  Snack: { id: "Camilan", en: "Snack" },
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
