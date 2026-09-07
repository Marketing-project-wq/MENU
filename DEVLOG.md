# DEVLOG — menu.20fit.id

> Entry terbaru di paling atas.

---

## 2026-09-07 — Ikon minimalis (ganti emoji) + artikel prosa panjang + gambar

Branch: `claude/menu-20fit-moderation-9qqf9t`

Empat perbaikan area Menu/Artikel. **Frontend** self-contained di repo ini (butuh CI build lulus,
lalu merge → Railway). **Konten artikel** ada di DB `my20fit_recipe_article` (Supabase, dipakai
bersama my.20fit.id) — disiapkan sebagai **SQL yang DITULIS, bukan dijalankan** (owner review dulu).

### 1) Semua emoji UI → sistem ikon garis (line icon) minimalis
- Komponen baru `src/components/Icon.tsx`: 35 ikon garis inline-SVG (`currentColor`, stroke
  membulat, viewBox 24). Tanpa dependency (registry npm diblok kebijakan org).
- Emoji diganti ikon di: `FoodTypeChips` (🍗🥩🦐🥗🌱🍚🍝🍜 → drumstick/steak/fish/salad/sprout/
  bowlRice/noodles), `DetailPage` (🍽️🔪⏱️ → servings/knife/clock), `HomePage` (🛵 + panah),
  `EatNowLinks`, `EatNowButton`, `CatererList` (📍🍱✓ → pin/store/check), `SubmitPage` (✅ → check),
  `Header` (☀️🌙 → sun/moon), `ShareMenu` (💬✈️📘✕ → whatsapp/telegram/facebook/xSocial + close),
  `RelatedArticles` (📝), `ArticleCard`/`CoverImage`/`FoodImage` (fallback pakai ikon kategori/
  makanan, bukan emoji). Panah teks `←` pada tombol "kembali" juga → ikon `arrowLeft`.
- **Fungsi tidak diubah** — murni tampilan simbol.

### 2) Emoji di JUDUL artikel dibersihkan
- **50 dari 54 judul** tersimpan diawali emoji kategori (🍎🏃🥗⚖️🍱👩‍🍳📍🧬) di DB.
- Frontend: helper `src/lib/text.ts` `cleanTitle()` strip emoji di awal judul saat render
  (`ArticleCard`, `ArticleDetailPage`, `RelatedArticles`; Home pakai `ArticleCard`). Ikon kategori
  minimalis (`categoryIconName`) menggantikan peran emoji itu.
- DB: SQL (A) di `docs/articles_expand_batch1.sql` merapikan judul di sumbernya juga.

### 3) Renderer artikel dirapikan jadi prosa enak dibaca
- `src/lib/markdown.ts`: paragraf `text-[15px] leading-7` + jarak antar paragraf lebih lega,
  subjudul lebih menonjol, gambar `rounded-2xl` + margin, dukungan blockquote `>`.
- `ArticleDetailPage`: judul lebih besar, chip kategori + ikon, wrapper prosa.

### 4) Gambar artikel — diagnosis + isi konten
- **Akar masalah**: 50 artikel punya cover+1 gambar body dari **hotlink Unsplash**; **4 artikel
  terbaru TIDAK punya gambar** (tampil placeholder). App menyembunyikan gambar yang gagal load,
  jadi hotlink pihak-ketiga yang gagal = tampil kosong. **0 gambar dari media.20fit** (artikel ini
  in-house, bukan WordPress — jadi tak ada "gambar sumber asli" untuk ditarik).
- **Perbaikan batch 1**: tiap artikel dapat 1 gambar relevan; 4 yang kosong memakai ULANG URL
  Unsplash yang **sudah dipakai & cocok topik** di situs ini (bukan ID karangan yang bisa 404).

### Konten: `docs/articles_expand_batch1.sql` (BATCH 1 — 6 artikel, WRITE-not-RUN)
- Artikel diperpanjang dari ~150 kata → **1.000–1.140 kata (5–6 menit baca)**, format **prosa**
  (bukan daftar bullet), framing edukasi + disclaimer dipertahankan. "Min read" tetap dihitung
  otomatis dari jumlah kata (`src/lib/readtime.ts`).
- Artikel: `baca-menu-restoran-5-kata-kunci`, `cara-pilih-menu-sehat-saat-pesan-online`,
  `masak-sendiri-vs-pesan-makan`, `ngemil-tanpa-rasa-bersalah`,
  `protein-harian-...`, `defisit-kalori-101-...` (mencakup ke-4 artikel yang tadinya tak bergambar).
- **TIDAK mengarang**: isi = perluasan jujur topik praktis; klaim kesehatan umum & hati-hati.
- Jalankan manual di Supabase (`BEGIN; ... COMMIT;`) setelah review.

### Sisa (belum & sengaja tak dijalankan)
- **48 artikel lain** menyusul di batch berikutnya, format & standar yang sama (tak ada yang perlu
  dikarang untuk mencapai panjang; kalau ada yang tak bisa dipanjangkan jujur → dilaporkan).
- **Keandalan gambar**: kalau Unsplash gagal load untuk user, solusi tahan-lama = rehost ke Storage
  20FIT (butuh egress/instruksi owner) — diusulkan, belum dikerjakan.
- **Body EN**: artikel saat ini ID saja (path render `body_md`). Terjemahan EN + switch bahasa
  per-artikel = pekerjaan terpisah (butuh perubahan backend).

Files: `src/components/Icon.tsx` (baru), `src/lib/text.ts` (baru),
`docs/articles_expand_batch1.sql` (baru), `src/lib/markdown.ts`, `src/pages/ArticleDetailPage.tsx`,
`src/pages/DetailPage.tsx`, `src/pages/HomePage.tsx`, `src/pages/SubmitPage.tsx`,
`src/components/{FoodTypeChips,EatNowLinks,EatNowButton,CatererList,Header,ShareMenu,RelatedArticles,ArticleCard,CoverImage,FoodImage,RecipeForm,RecipeNotFound}.tsx`,
`src/lib/i18n.ts`.

---

## 2026-09-03 — Menu/Diet/Home enhancements (5 fitur)

Branch: `claude/menu-diet-home-enhancements-ibp58o`

Lima perubahan di area Menu / Resep / Beranda. Semua **self-contained di repo ini** (frontend) —
tidak menyentuh PROFILE20FIT (my.20fit.id) dan tidak butuh deploy Railway repo lain. Bagian yang
bergantung data eksternal dibuat **graceful** (tampil apa adanya, tidak error) dan dilengkapi SQL
opsional yang **kamu** jalankan lewat jalur Supabase terpisah.

### 1) Halaman Menu — detail nutrisi
- **Daftar bahan** sudah ada sebelumnya (`IngredientGroups`) — tidak diubah.
- **Gizi** kini mendukung field mikro **fiber / sugar / sodium** dan **makro member** (kolom
  `my20fit_menu_contribution.macros` jsonb yang sebelumnya tidak dibaca). Ditampilkan **kondisional**:
  hanya field yang benar-benar ada di sumber datanya yang muncul (tak ada angka karangan).
- Kcal + protein/karbo/lemak (official) tetap seperti semula.
- **Belum terisi datanya**: fiber/sugar/sodium belum ada di sumber mana pun. Untuk mengisinya:
  - Official: tambah field `fiber`/`sugar`/`sodium` di objek resep `js/recipes.js` (PROFILE20FIT) —
    API `/api/menu/catalog` otomatis meneruskannya, UI langsung menampilkannya.
  - Member: pastikan `/api/menu/published` ikut mengirim kolom `macros` (jsonb) pada select-nya.

Files: `src/lib/types.ts`, `src/lib/normalize.ts`, `src/pages/DetailPage.tsx`, `src/lib/i18n.ts`.

### 2) Browse → Recipe (rename label)
- Label tab/nav "Browse/Jelajah" → **"Recipe/Resep"**. Hanya string user-facing (i18n key `browse`,
  `backToBrowse`, `browseAllRecipes`). **Tidak** menyentuh route name internal `"browse"`, `case "browse"`,
  komponen `BrowsePage`, atau URL `/resep`. Tak ada event analytics yang memakai string ini.

Files: `src/lib/i18n.ts`.

### 3) Home — "Favorite Recipe" (carousel)
- Seksi baru di beranda, **carousel geser-horizontal** (scroll-snap, tanpa library). Memakai ulang
  `RecipeCard` (kartu yang sama dengan grid) — komponen baru `RecipeCarousel`.
- **"Favorit" = pilihan editorial deterministik** (disebar lintas kategori, stabil). Alasan: data
  popularitas masih kosong (`my20fit_menu_reaction` = 0 baris, save = 0, open sangat sedikit), jadi
  ranking "paling banyak di-love" belum bermakna.
- **Upgrade path** (tanpa ubah UI): `my20fit_menu_reaction` sudah anon-readable, jadi begitu jumlah
  heart cukup, ganti `pickFavorites` jadi "top by reaction". Atau pakai tabel kurasi admin (SQL di bawah).

Files: `src/components/RecipeCarousel.tsx` (baru), `src/lib/favorites.ts` (baru), `src/pages/HomePage.tsx`.

### 4) Home — "Top 5 Article to Read Today" + "X min read"
- Seksi artikel beranda jadi **Top 5** (terbaru; API sudah urut terbaru). Kartu artikel kini
  menampilkan **badge "X min read"** di depan (pojok gambar).
- Read-time **dihitung dari word count body** (~200 kata/menit, rumus sama dengan halaman detail).
  Karena endpoint daftar artikel tidak mengangkut body, peta menit-baca diambil **langsung dari
  Supabase** (`lib/readtime.ts`, satu query, di-cache). **Butuh policy anon SELECT** di
  `my20fit_recipe_article` — lihat SQL WAJIB di bawah. Tanpa policy itu, kartu tetap tampil, hanya
  tanpa badge "min read" (graceful).
- Catatan jujur: rata-rata artikel ~123 kata → mayoritas akan tampil **"1 min read"**.
- Konfirmasi: **sumber artikel SUDAH ADA** (bukan belum ada) — tabel in-house `my20fit_recipe_article`
  (54 baris, bilingual), disajikan via `/api/menu/articles`. Bukan WordPress.

Files: `src/lib/readtime.ts` (baru), `src/components/ArticleCard.tsx`, `src/pages/HomePage.tsx`,
`src/pages/ArticlesPage.tsx`, `src/lib/types.ts`, `src/lib/i18n.ts`.

### 5) Toggle filter tipe makanan (paling atas)
- Baris chip tipe makanan (Chicken/Beef/Seafood/Vegetarian/Vegan/Rice/Pasta/Noodle) di **paling atas
  beranda**. Klik → `navigate('/resep?category=<cat>')` → halaman Resep terbuka **sudah terfilter**.
- **Tidak ada akal-akalan match nama**: memakai kolom kategori (`OfficialRecipe.cat`) yang memang
  sudah ada + jalur filter `?category=` yang sudah jalan di `BrowsePage`.
- Chip hanya ditaruh di **Home** (bukan di BrowsePage) karena BrowsePage membaca filter dari URL hanya
  saat mount; menaruh chip di dalamnya akan mengubah URL tanpa memfilter ulang (bug). Dari Home,
  BrowsePage mount fresh → filter benar.
- **Batasan struktural** (bukan blocker sekarang): resep **member** tak punya kolom kategori
  (`diet_type` saja), jadi tak akan muncul di filter tipe makanan. Sekarang 0 member → tak berdampak.

Files: `src/components/FoodTypeChips.tsx` (baru), `src/pages/HomePage.tsx`, `src/lib/i18n.ts`.

---

### SQL untuk dijalankan sendiri (JANGAN otomatis — lewat jalur Supabase terpisah)

**WAJIB** agar "X min read" (fitur 4) muncul — beri anon izin baca artikel terbit (isinya memang
sudah publik lewat website):

```sql
alter table public.my20fit_recipe_article enable row level security; -- (biasanya sudah on)
create policy "recipe_article public read published"
  on public.my20fit_recipe_article
  for select to anon, authenticated
  using (status = 'published');
```

**OPSIONAL** — kalau mau "Favorit" (fitur 3) jadi kurasi admin yang bisa diganti tanpa deploy:

```sql
create table if not exists public.my20fit_menu_featured (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('official','member')),
  menu_id text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (source, menu_id)
);
alter table public.my20fit_menu_featured enable row level security;
create policy "menu_featured public read" on public.my20fit_menu_featured
  for select to anon, authenticated using (active = true);
-- Tulis hanya via service role (admin my.20fit.id). Setelah terisi, wire pickFavorites() ke tabel ini.
```

**OPSIONAL** — kalau mau kurasi "Top 5" artikel (bukan sekadar terbaru):

```sql
alter table public.my20fit_recipe_article
  add column if not exists featured boolean not null default false,
  add column if not exists sort_order int not null default 0;
```

**OPSIONAL** — kalau fiber/sugar/sodium mau ditaruh di Supabase (bukan `js/recipes.js`):

```sql
create table if not exists public.my20fit_menu_nutrition (
  source text not null check (source in ('official','member')),
  menu_id text not null,
  fiber_g numeric, sugar_g numeric, sodium_mg numeric,
  updated_at timestamptz not null default now(),
  primary key (source, menu_id)
);
alter table public.my20fit_menu_nutrition enable row level security;
create policy "menu_nutrition public read" on public.my20fit_menu_nutrition
  for select to anon, authenticated using (true);
```

### Catatan keamanan (di luar scope, belum disentuh)
Advisory Supabase menandai **73 tabel dengan RLS nonaktif** di project bersama `cpvzwqptzcxnwzfzgrmt`
(mayoritas modul lain: clinic/cf/arena). Tidak diubah oleh perubahan ini. Perlu ditinjau terpisah.
