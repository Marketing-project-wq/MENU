const https = require('https');
const fs = require('fs');
const path = require('path');

const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SERVICE_KEY || !SUPABASE_URL) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const host = SUPABASE_URL.replace('https://', '');

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const req = https.request({
      hostname: host,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=representation',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers,
      },
    }, (res) => {
      let out = '';
      res.on('data', c => out += c);
      res.on('end', () => resolve({ status: res.statusCode, body: out }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Seed data — 20 healthy recipes
const recipes = [
  { name: 'Oatmeal Pisang Madu', category: 'breakfast', description: 'Oatmeal hangat dengan potongan pisang dan drizzle madu, kaya serat dan energi tahan lama.', calories: 320, protein_g: 10, carbs_g: 58, fat_g: 6, fiber_g: 7, sugar_g: 18, sodium_mg: 120, serving_size: 1, serving_unit: 'porsi', ingredients: [{"item":"oat rolled","amount":"80g"},{"item":"susu rendah lemak","amount":"200ml"},{"item":"pisang","amount":"1 buah"},{"item":"madu","amount":"1 sdm"}], steps: [{"step":1,"text":"Masak oat dengan susu selama 5 menit sambil diaduk."},{"step":2,"text":"Tuang ke mangkuk, iris pisang di atasnya."},{"step":3,"text":"Drizzle madu dan sajikan hangat."}], prep_time_min: 5, cook_time_min: 5, tags: ['high-fiber','vegetarian','meal-prep'] },
  { name: 'Telur Rebus & Roti Gandum', category: 'breakfast', description: 'Kombinasi protein dan karbohidrat kompleks untuk sarapan seimbang.', calories: 280, protein_g: 18, carbs_g: 28, fat_g: 10, fiber_g: 4, sugar_g: 3, sodium_mg: 380, serving_size: 1, serving_unit: 'porsi', ingredients: [{"item":"telur","amount":"2 butir"},{"item":"roti gandum","amount":"2 lembar"},{"item":"alpukat","amount":"1/4 buah"}], steps: [{"step":1,"text":"Rebus telur 8 menit."},{"step":2,"text":"Haluskan alpukat, oleskan di roti gandum."},{"step":3,"text":"Kupas telur, sajikan bersama roti."}], prep_time_min: 5, cook_time_min: 10, tags: ['high-protein'] },
  { name: 'Smoothie Hijau Bayam', category: 'breakfast', description: 'Smoothie segar dari bayam, apel hijau, dan jahe.', calories: 180, protein_g: 5, carbs_g: 38, fat_g: 2, fiber_g: 5, sugar_g: 22, sodium_mg: 80, serving_size: 1, serving_unit: 'gelas', ingredients: [{"item":"bayam segar","amount":"60g"},{"item":"apel hijau","amount":"1 buah"},{"item":"pisang beku","amount":"1/2 buah"},{"item":"air kelapa","amount":"200ml"}], steps: [{"step":1,"text":"Masukkan semua bahan ke blender."},{"step":2,"text":"Blender hingga halus."},{"step":3,"text":"Sajikan segera."}], prep_time_min: 5, cook_time_min: 0, tags: ['vegan','detox','low-calorie'] },
  { name: 'Yogurt Granola Berry', category: 'breakfast', description: 'Greek yogurt rendah lemak dengan granola dan campuran berry antioksidan.', calories: 290, protein_g: 16, carbs_g: 42, fat_g: 6, fiber_g: 4, sugar_g: 20, sodium_mg: 95, serving_size: 1, serving_unit: 'porsi', ingredients: [{"item":"greek yogurt plain 0%","amount":"150g"},{"item":"granola","amount":"40g"},{"item":"stroberi","amount":"50g"},{"item":"blueberry","amount":"30g"}], steps: [{"step":1,"text":"Tuang yogurt ke mangkuk."},{"step":2,"text":"Tabur granola dan berry."}], prep_time_min: 3, cook_time_min: 0, tags: ['high-protein','probiotic','vegetarian'] },
  { name: 'Nasi Merah Ayam Panggang', category: 'lunch', description: 'Nasi merah bergizi dengan dada ayam panggang dan tumis brokoli.', calories: 450, protein_g: 38, carbs_g: 52, fat_g: 8, fiber_g: 6, sugar_g: 3, sodium_mg: 420, serving_size: 1, serving_unit: 'porsi', ingredients: [{"item":"nasi merah","amount":"150g matang"},{"item":"dada ayam","amount":"150g"},{"item":"brokoli","amount":"100g"}], steps: [{"step":1,"text":"Marinasi ayam dengan bawang putih dan kecap."},{"step":2,"text":"Panggang ayam 6 menit per sisi."},{"step":3,"text":"Tumis brokoli, sajikan bersama nasi merah."}], prep_time_min: 15, cook_time_min: 15, tags: ['high-protein','low-fat','meal-prep'] },
  { name: 'Salad Tuna Nicoise', category: 'lunch', description: 'Salad dengan tuna, telur rebus, buncis, dan dressing mustard lemon.', calories: 310, protein_g: 30, carbs_g: 18, fat_g: 14, fiber_g: 5, sugar_g: 4, sodium_mg: 520, serving_size: 1, serving_unit: 'porsi', ingredients: [{"item":"tuna kalengan in water","amount":"120g"},{"item":"telur","amount":"2 butir"},{"item":"buncis","amount":"80g"},{"item":"tomat cherry","amount":"100g"}], steps: [{"step":1,"text":"Rebus telur dan buncis."},{"step":2,"text":"Buat dressing dari minyak zaitun dan lemon."},{"step":3,"text":"Susun semua bahan, siram dressing."}], prep_time_min: 10, cook_time_min: 10, tags: ['high-protein','low-carb'] },
  { name: 'Sup Ayam Sayuran', category: 'lunch', description: 'Sup bening kaldu ayam dengan wortel, kentang, dan sayuran segar.', calories: 280, protein_g: 24, carbs_g: 30, fat_g: 5, fiber_g: 5, sugar_g: 6, sodium_mg: 480, serving_size: 1, serving_unit: 'mangkuk', ingredients: [{"item":"ayam fillet","amount":"120g"},{"item":"wortel","amount":"80g"},{"item":"kentang","amount":"80g"}], steps: [{"step":1,"text":"Tumis bawang bombay."},{"step":2,"text":"Masukkan kaldu dan didihkan."},{"step":3,"text":"Tambahkan ayam dan sayuran, masak 20 menit."}], prep_time_min: 10, cook_time_min: 25, tags: ['low-calorie','gluten-free'] },
  { name: 'Wrap Gandum Hummus', category: 'lunch', description: 'Tortilla gandum diisi hummus, timun, wortel, dan paprika.', calories: 340, protein_g: 12, carbs_g: 52, fat_g: 10, fiber_g: 9, sugar_g: 5, sodium_mg: 490, serving_size: 1, serving_unit: 'wrap', ingredients: [{"item":"tortilla gandum utuh","amount":"1 lembar"},{"item":"hummus","amount":"3 sdm"},{"item":"timun","amount":"1/2 buah"},{"item":"paprika merah","amount":"1/4 buah"}], steps: [{"step":1,"text":"Oleskan hummus di tortilla."},{"step":2,"text":"Susun sayuran, gulung rapat."}], prep_time_min: 10, cook_time_min: 0, tags: ['vegan','high-fiber'] },
  { name: 'Ikan Salmon Kukus Jahe', category: 'dinner', description: 'Salmon kukus dengan jahe dan daun bawang, tinggi omega-3.', calories: 360, protein_g: 34, carbs_g: 8, fat_g: 20, fiber_g: 1, sugar_g: 3, sodium_mg: 340, serving_size: 1, serving_unit: 'porsi', ingredients: [{"item":"fillet salmon","amount":"180g"},{"item":"jahe","amount":"3 cm"},{"item":"daun bawang","amount":"2 batang"}], steps: [{"step":1,"text":"Taruh salmon di piring tahan panas."},{"step":2,"text":"Letakkan jahe dan daun bawang di atas salmon."},{"step":3,"text":"Kukus 12-15 menit."}], prep_time_min: 5, cook_time_min: 15, tags: ['omega-3','high-protein','gluten-free'] },
  { name: 'Tempe Orek Rendah Minyak', category: 'dinner', description: 'Tempe dimasak kering dengan bumbu kecap rendah sodium.', calories: 220, protein_g: 18, carbs_g: 16, fat_g: 10, fiber_g: 5, sugar_g: 4, sodium_mg: 290, serving_size: 1, serving_unit: 'porsi', ingredients: [{"item":"tempe","amount":"150g"},{"item":"bawang putih","amount":"3 siung"},{"item":"kecap manis rendah sodium","amount":"1 sdm"}], steps: [{"step":1,"text":"Iris tempe tipis."},{"step":2,"text":"Tumis bawang, masukkan tempe hingga kecoklatan."},{"step":3,"text":"Tambahkan kecap, masak kering."}], prep_time_min: 10, cook_time_min: 15, tags: ['high-protein','vegan','local-food'] },
  { name: 'Dada Ayam Bakar Rempah', category: 'dinner', description: 'Dada ayam tanpa kulit dibakar dengan marinasi rempah.', calories: 270, protein_g: 42, carbs_g: 4, fat_g: 9, fiber_g: 1, sugar_g: 2, sodium_mg: 380, serving_size: 1, serving_unit: 'porsi', ingredients: [{"item":"dada ayam tanpa kulit","amount":"200g"},{"item":"kunyit bubuk","amount":"1/2 sdt"},{"item":"ketumbar","amount":"1 sdt"}], steps: [{"step":1,"text":"Haluskan bumbu, marinasi ayam 30 menit."},{"step":2,"text":"Bakar di grill pan 7 menit per sisi."}], prep_time_min: 35, cook_time_min: 15, tags: ['high-protein','low-fat','gluten-free'] },
  { name: 'Tumis Tahu Paprika', category: 'dinner', description: 'Tahu firm ditumis dengan paprika merah, kuning, hijau.', calories: 230, protein_g: 16, carbs_g: 14, fat_g: 13, fiber_g: 4, sugar_g: 6, sodium_mg: 310, serving_size: 1, serving_unit: 'porsi', ingredients: [{"item":"tahu firm","amount":"200g"},{"item":"paprika merah","amount":"1/2 buah"},{"item":"paprika kuning","amount":"1/2 buah"}], steps: [{"step":1,"text":"Goreng tahu hingga kecoklatan."},{"step":2,"text":"Tumis paprika, masukkan tahu."},{"step":3,"text":"Tambahkan kecap asin, aduk rata."}], prep_time_min: 10, cook_time_min: 15, tags: ['vegan','high-protein'] },
  { name: 'Edamame Rebus', category: 'snack', description: 'Edamame kukus dengan sedikit garam laut, camilan tinggi protein.', calories: 120, protein_g: 11, carbs_g: 10, fat_g: 5, fiber_g: 5, sugar_g: 2, sodium_mg: 180, serving_size: 1, serving_unit: 'porsi', ingredients: [{"item":"edamame beku","amount":"150g"},{"item":"garam laut","amount":"1/4 sdt"}], steps: [{"step":1,"text":"Rebus edamame 5 menit."},{"step":2,"text":"Tabur garam laut, sajikan."}], prep_time_min: 1, cook_time_min: 5, tags: ['vegan','high-protein','low-calorie'] },
  { name: 'Apel & Almond Butter', category: 'snack', description: 'Apel segar dengan almond butter, kombinasi serat dan lemak sehat.', calories: 180, protein_g: 4, carbs_g: 25, fat_g: 9, fiber_g: 5, sugar_g: 17, sodium_mg: 40, serving_size: 1, serving_unit: 'porsi', ingredients: [{"item":"apel merah","amount":"1 buah"},{"item":"almond butter","amount":"1 sdm"}], steps: [{"step":1,"text":"Potong apel menjadi irisan."},{"step":2,"text":"Sajikan bersama almond butter."}], prep_time_min: 3, cook_time_min: 0, tags: ['vegan','no-cook','portable'] },
  { name: 'Overnight Oat Chia', category: 'snack', description: 'Oat dan biji chia direndam semalam, siap makan tanpa masak.', calories: 240, protein_g: 8, carbs_g: 38, fat_g: 7, fiber_g: 8, sugar_g: 10, sodium_mg: 90, serving_size: 1, serving_unit: 'toples', ingredients: [{"item":"oat rolled","amount":"50g"},{"item":"biji chia","amount":"1 sdm"},{"item":"susu almond","amount":"150ml"}], steps: [{"step":1,"text":"Campurkan oat, chia, susu almond dalam toples."},{"step":2,"text":"Simpan di kulkas semalaman."}], prep_time_min: 5, cook_time_min: 0, tags: ['vegan','meal-prep','high-fiber'] },
  { name: 'Infused Water Lemon Mint', category: 'drink', description: 'Air infus lemon dan mint, menyegarkan tanpa kalori.', calories: 10, protein_g: 0, carbs_g: 2, fat_g: 0, fiber_g: 0, sugar_g: 1, sodium_mg: 5, serving_size: 500, serving_unit: 'ml', ingredients: [{"item":"lemon","amount":"1/2 buah"},{"item":"daun mint","amount":"8 lembar"},{"item":"air dingin","amount":"500ml"}], steps: [{"step":1,"text":"Masukkan lemon dan mint ke pitcher."},{"step":2,"text":"Tuang air dingin, diamkan 30 menit."}], prep_time_min: 5, cook_time_min: 0, tags: ['vegan','zero-calorie','hydration'] },
  { name: 'Jus Wortel Jeruk Jahe', category: 'drink', description: 'Jus segar wortel, jeruk, dan jahe, kaya vitamin C.', calories: 130, protein_g: 2, carbs_g: 30, fat_g: 1, fiber_g: 4, sugar_g: 20, sodium_mg: 70, serving_size: 300, serving_unit: 'ml', ingredients: [{"item":"wortel","amount":"2 buah"},{"item":"jeruk","amount":"2 buah"},{"item":"jahe","amount":"1 cm"}], steps: [{"step":1,"text":"Peras jeruk."},{"step":2,"text":"Juice wortel dan jahe."},{"step":3,"text":"Campurkan, aduk rata."}], prep_time_min: 5, cook_time_min: 0, tags: ['vegan','immune-boost'] },
  { name: 'Susu Kedelai Vanilla Hangat', category: 'drink', description: 'Susu kedelai dengan vanila, alternatif nabati kaya protein.', calories: 100, protein_g: 7, carbs_g: 8, fat_g: 4, fiber_g: 1, sugar_g: 4, sodium_mg: 90, serving_size: 250, serving_unit: 'ml', ingredients: [{"item":"susu kedelai unsweetened","amount":"250ml"},{"item":"vanila ekstrak","amount":"1/4 sdt"}], steps: [{"step":1,"text":"Panaskan susu kedelai."},{"step":2,"text":"Tambahkan vanila, aduk rata."}], prep_time_min: 2, cook_time_min: 3, tags: ['vegan','dairy-free'] },
  { name: 'Smoothie Protein Coklat', category: 'drink', description: 'Smoothie coklat dengan pisang dan protein powder, post-workout terbaik.', calories: 280, protein_g: 18, carbs_g: 40, fat_g: 5, fiber_g: 5, sugar_g: 22, sodium_mg: 130, serving_size: 300, serving_unit: 'ml', ingredients: [{"item":"pisang beku","amount":"1 buah"},{"item":"susu rendah lemak","amount":"200ml"},{"item":"bubuk kakao","amount":"1 sdm"},{"item":"protein powder vanilla","amount":"1 scoop"}], steps: [{"step":1,"text":"Masukkan semua bahan ke blender."},{"step":2,"text":"Blender 60 detik hingga creamy."}], prep_time_min: 5, cook_time_min: 0, tags: ['high-protein','post-workout'] },
  { name: 'Air Kelapa Segar', category: 'drink', description: 'Air kelapa muda alami, elektrolit alami rendah kalori.', calories: 50, protein_g: 1, carbs_g: 12, fat_g: 0, fiber_g: 0, sugar_g: 10, sodium_mg: 100, serving_size: 250, serving_unit: 'ml', ingredients: [{"item":"air kelapa muda segar","amount":"250ml"}], steps: [{"step":1,"text":"Buka kelapa muda, tuang ke gelas."}], prep_time_min: 2, cook_time_min: 0, tags: ['vegan','natural','electrolyte'] },
];

async function run() {
  console.log('Testing Supabase REST API connection...');
  const test = await request('GET', '/rest/v1/recipes?limit=1', null);
  console.log('Response:', test.status);

  if (test.status === 404 || test.body.includes('relation "recipes" does not exist')) {
    console.error('Table "recipes" does not exist yet. Please run schema.sql first in Supabase SQL editor.');
    process.exit(1);
  }

  if (test.status >= 400 && !test.body.includes('does not exist')) {
    console.error('Connection failed:', test.body.slice(0, 200));
    process.exit(1);
  }

  console.log('Inserting 20 recipes via REST API...');
  const res = await request('POST', '/rest/v1/recipes', recipes, {
    'Prefer': 'resolution=ignore-duplicates,return=minimal',
  });

  if (res.status >= 400) {
    console.error('Insert failed:', res.status, res.body.slice(0, 500));
    process.exit(1);
  }

  console.log(`Done! Status: ${res.status}. 20 recipes seeded.`);
}

run().catch(err => { console.error(err.message); process.exit(1); });
