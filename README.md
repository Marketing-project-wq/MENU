# menu.20fit.id

Frontend katalog & kontribusi resep sehat 20FIT — mirip Cookpad, tersambung ke ekosistem **my.20fit.id**.

- **Browse publik** (tanpa login): resep resmi 20FIT + kontribusi member yang sudah **di-approve admin**.
- **Submit resep** (butuh akun 20FIT): masuk antrian review — **TIDAK langsung tayang**.
- **Moderasi** dilakukan admin di **my.20fit.id** (bukan di sini). Hanya resep `approved+published` yang tampil publik.

## Arsitektur (sama pola calories.20fit.id)

- **Frontend** React + Vite + Tailwind (repo ini), deploy di **Railway** (`serve dist -s`).
- **Data & auth**: Supabase project bersama `20FIT ALL DATA` (`cpvzwqptzcxnwzfzgrmt`). Frontend **hanya pakai anon key**.
- **Operasi sensitif** (submit, katalog, moderasi) lewat **API my.20fit.id** yang cek auth/role di server.
- **SSO**: login diarahkan ke `my.20fit.id/login?next=menu`; kembali via **URL fragment** (`#access_token=…&refresh_token=…`) yang **langsung di-strip** dari URL (tidak pernah masuk log server).

### Sumber data (satu sumber)

| Data | Sumber | Endpoint |
|---|---|---|
| Resep resmi 20FIT (~120) | `js/recipes.js` di my.20fit.id | `GET /api/menu/catalog` |
| Kontribusi member approved | tabel `my20fit_menu_contribution` | `GET /api/menu/published` |
| Submit / revisi / status | server my.20fit.id | `POST /api/menu/submit`, `GET /api/menu/mine`, `POST /api/menu/:id/revise` |

Angka gizi = **perkiraan** (resmi & member sama-sama ditandai; sumber dibedakan di UI).

## Menjalankan

```bash
npm install
cp .env.example .env   # isi VITE_SUPABASE_ANON_KEY; VITE_API_URL default my.20fit.id
npm run dev            # dev server
npm run build          # typecheck + build produksi -> dist/
npm start              # serve dist (Railway)
```

## Env

| Variable | Keterangan |
|---|---|
| `VITE_SUPABASE_ANON_KEY` | Anon key Supabase (project `cpvzwqptzcxnwzfzgrmt`). **Bukan** service key. |
| `VITE_API_URL` | Base API. Default `https://my.20fit.id`. |

## Deploy (Railway) + domain

1. Buat service Railway dari repo ini (build `npm run build`, start `npm run start`).
2. Set env `VITE_SUPABASE_ANON_KEY` (+ `VITE_API_URL` bila staging).
3. Railway → **Custom Domain** `menu.20fit.id` → dapat target CNAME.
4. **Cloudflare DNS (20fit.id)**: tambah **CNAME `menu` → target Railway**.

> Bagian moderasi + endpoint publik ada di repo **PROFILE20FIT** (my.20fit.id).
