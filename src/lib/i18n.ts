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
  notFound: { id: "Resep tidak ditemukan.", en: "Recipe not found." },
  category: { id: "Kategori", en: "Category" },
  dietType: { id: "Tipe diet", en: "Diet type" },
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

export function statusLabel(status: string, lang: Lang): string {
  return STATUS_LABELS[status]?.[lang] ?? status;
}
