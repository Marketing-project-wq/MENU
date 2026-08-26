# Menu 20FIT API

Backend REST API untuk [menu.20fit.id](https://menu.20fit.id) — katalog menu makanan sehat dengan kalori & makro.

## Fitur

| Fitur | Guest | Member |
|---|:---:|:---:|
| Lihat katalog resep/menu | ✓ | ✓ |
| Lihat detail resep (kalori & makro) | ✓ | ✓ |
| Generator meal plan generik | ✓ | ✓ |
| Meal plan personal (sisa kalori akun) | — | ✓ |
| Simpan / favoritkan resep | — | ✓ |
| Tracking menu yang dimakan | — | ✓ |
| Riwayat meal plan | — | ✓ |

## Stack

- **Runtime**: Node.js 18+ / Express 4
- **Database & Auth**: Supabase (PostgreSQL + RLS)
- **Auth pattern**: SSO token dari `my.20fit.id` via URL fragment

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Salin env dan isi nilai Supabase
cp .env.example .env

# 3. Jalankan schema & seed di Supabase SQL Editor
#    supabase/schema.sql  → buat tabel & RLS
#    supabase/seed.sql    → 20 resep awal

# 4. Jalankan server
npm run dev
```

## Endpoints

### Guest (tanpa login)

```
GET  /api/menu/recipes                  Daftar resep, filter: ?category=lunch&search=ayam&page=1&limit=20
GET  /api/menu/recipes/:id              Detail resep + status favorit (jika ada token)
POST /api/menu/generic-plan             Meal plan generik berdasarkan target kalori
  body: { "target_calories": 1800, "days": 3 }
```

### Member (butuh Bearer token)

```
GET  /api/menu/personalized-plan        Meal plan personal berdasarkan sisa kalori akun
POST /api/menu/favorite                 Toggle favorit resep
  body: { "recipe_id": "<uuid>" }
POST /api/menu/log                      Log makanan yang dimakan
  body: { "recipe_id": "<uuid>", "servings": 1, "eaten_at": "2024-01-15T12:00:00Z" }
GET  /api/menu/history                  Riwayat meal log, filter: ?date=2024-01-15&page=1
```

### Auth header

```
Authorization: Bearer <supabase_access_token>
```

Token dikirim dari `my.20fit.id` via URL fragment saat SSO login.

## Kategori Resep

`breakfast` · `lunch` · `dinner` · `snack` · `drink`
