-- =============================================================
-- Seed data: 20 resep makanan sehat untuk menu.20fit.id
-- =============================================================

INSERT INTO recipes (name, category, description, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, serving_size, serving_unit, ingredients, steps, prep_time_min, cook_time_min, tags) VALUES

-- BREAKFAST
('Oatmeal Pisang Madu', 'breakfast',
 'Oatmeal hangat dengan potongan pisang dan drizzle madu, kaya serat dan energi tahan lama.',
 320, 10, 58, 6, 7, 18, 120, 1, 'porsi',
 '[{"item":"oat rolled","amount":"80g"},{"item":"susu rendah lemak","amount":"200ml"},{"item":"pisang","amount":"1 buah"},{"item":"madu","amount":"1 sdm"}]',
 '[{"step":1,"text":"Masak oat dengan susu selama 5 menit sambil diaduk."},{"step":2,"text":"Tuang ke mangkuk, iris pisang di atasnya."},{"step":3,"text":"Drizzle madu dan sajikan hangat."}]',
 5, 5, ARRAY['high-fiber','vegetarian','meal-prep']),

('Telur Rebus & Roti Gandum', 'breakfast',
 'Kombinasi protein dan karbohidrat kompleks untuk sarapan seimbang.',
 280, 18, 28, 10, 4, 3, 380, 1, 'porsi',
 '[{"item":"telur","amount":"2 butir"},{"item":"roti gandum","amount":"2 lembar"},{"item":"alpukat","amount":"¼ buah"},{"item":"garam & merica","amount":"secukupnya"}]',
 '[{"step":1,"text":"Rebus telur 8 menit untuk matang sempurna."},{"step":2,"text":"Haluskan alpukat, oleskan di roti gandum."},{"step":3,"text":"Kupas telur, sajikan bersama roti."}]',
 5, 10, ARRAY['high-protein','gluten-free-option']),

('Smoothie Hijau Bayam', 'breakfast',
 'Smoothie segar dari bayam, apel hijau, dan jahe — detoks pagi yang menyegarkan.',
 180, 5, 38, 2, 5, 22, 80, 1, 'gelas',
 '[{"item":"bayam segar","amount":"60g"},{"item":"apel hijau","amount":"1 buah"},{"item":"pisang beku","amount":"½ buah"},{"item":"jahe","amount":"1 cm"},{"item":"air kelapa","amount":"200ml"}]',
 '[{"step":1,"text":"Masukkan semua bahan ke blender."},{"step":2,"text":"Blender hingga halus selama 1 menit."},{"step":3,"text":"Sajikan langsung dalam gelas."}]',
 5, 0, ARRAY['vegan','detox','low-calorie']),

('Yogurt Granola Berry', 'breakfast',
 'Greek yogurt rendah lemak dengan granola homemade dan campuran berry antioksidan.',
 290, 16, 42, 6, 4, 20, 95, 1, 'porsi',
 '[{"item":"greek yogurt plain 0%","amount":"150g"},{"item":"granola","amount":"40g"},{"item":"stroberi","amount":"50g"},{"item":"blueberry","amount":"30g"},{"item":"madu","amount":"1 sdt"}]',
 '[{"step":1,"text":"Tuang yogurt ke mangkuk."},{"step":2,"text":"Tabur granola di atasnya."},{"step":3,"text":"Taruh berry dan drizzle madu."}]',
 3, 0, ARRAY['high-protein','probiotic','vegetarian']),

-- LUNCH
('Nasi Merah Ayam Panggang', 'lunch',
 'Nasi merah bergizi tinggi dengan dada ayam panggang rendah lemak dan tumis brokoli.',
 450, 38, 52, 8, 6, 3, 420, 1, 'porsi',
 '[{"item":"nasi merah","amount":"150g matang"},{"item":"dada ayam","amount":"150g"},{"item":"brokoli","amount":"100g"},{"item":"bawang putih","amount":"2 siung"},{"item":"kecap rendah sodium","amount":"1 sdm"},{"item":"minyak zaitun","amount":"1 sdt"}]',
 '[{"step":1,"text":"Marinasi ayam dengan bawang putih dan kecap, diamkan 15 menit."},{"step":2,"text":"Panggang ayam di teflon 6 menit per sisi."},{"step":3,"text":"Tumis brokoli dengan minyak zaitun hingga matang."},{"step":4,"text":"Sajikan bersama nasi merah."}]',
 15, 15, ARRAY['high-protein','low-fat','meal-prep']),

('Salad Tuna Nicoise', 'lunch',
 'Salad Prancis klasik dengan tuna, telur rebus, buncis, dan dressing mustard lemon.',
 310, 30, 18, 14, 5, 4, 520, 1, 'porsi',
 '[{"item":"tuna kalengan in water","amount":"120g"},{"item":"telur","amount":"2 butir"},{"item":"buncis","amount":"80g"},{"item":"tomat cherry","amount":"100g"},{"item":"selada romaine","amount":"80g"},{"item":"minyak zaitun extra virgin","amount":"1 sdm"},{"item":"lemon","amount":"½ buah"},{"item":"mustard","amount":"1 sdt"}]',
 '[{"step":1,"text":"Rebus telur dan buncis."},{"step":2,"text":"Buat dressing dari minyak zaitun, perasan lemon, dan mustard."},{"step":3,"text":"Susun semua bahan di piring, siram dressing."}]',
 10, 10, ARRAY['high-protein','low-carb','mediterranean']),

('Sup Ayam Sayuran', 'lunch',
 'Sup bening kaldu ayam dengan wortel, kentang, dan berbagai sayuran segar.',
 280, 24, 30, 5, 5, 6, 480, 1, 'mangkuk',
 '[{"item":"ayam fillet","amount":"120g"},{"item":"wortel","amount":"80g"},{"item":"kentang","amount":"80g"},{"item":"buncis","amount":"50g"},{"item":"seledri","amount":"2 batang"},{"item":"bawang bombay","amount":"½ buah"},{"item":"kaldu ayam rendah sodium","amount":"500ml"}]',
 '[{"step":1,"text":"Tumis bawang bombay dan seledri sebentar."},{"step":2,"text":"Masukkan kaldu dan didihkan."},{"step":3,"text":"Tambahkan ayam dan semua sayuran."},{"step":4,"text":"Masak 20 menit hingga matang, koreksi rasa."}]',
 10, 25, ARRAY['low-calorie','gluten-free','meal-prep']),

('Wrap Gandum Hummus & Sayuran', 'lunch',
 'Tortilla gandum utuh diisi hummus, timun, wortel, paprika, dan daun selada.',
 340, 12, 52, 10, 9, 5, 490, 1, 'wrap',
 '[{"item":"tortilla gandum utuh","amount":"1 lembar"},{"item":"hummus","amount":"3 sdm"},{"item":"timun","amount":"½ buah"},{"item":"wortel","amount":"½ buah"},{"item":"paprika merah","amount":"¼ buah"},{"item":"selada","amount":"2 lembar"}]',
 '[{"step":1,"text":"Oleskan hummus merata di atas tortilla."},{"step":2,"text":"Susun sayuran yang sudah dipotong memanjang."},{"step":3,"text":"Gulung rapat dan potong miring."}]',
 10, 0, ARRAY['vegan','high-fiber','portable']),

-- DINNER
('Ikan Salmon Kukus Jahe', 'dinner',
 'Salmon kukus dengan irisan jahe dan daun bawang — tinggi omega-3, rendah kalori.',
 360, 34, 8, 20, 1, 3, 340, 1, 'porsi',
 '[{"item":"fillet salmon","amount":"180g"},{"item":"jahe","amount":"3 cm"},{"item":"daun bawang","amount":"2 batang"},{"item":"kecap ikan","amount":"1 sdt"},{"item":"perasan jeruk lemon","amount":"1 sdm"}]',
 '[{"step":1,"text":"Taruh salmon di atas kertas baking atau piring tahan panas."},{"step":2,"text":"Parut jahe, letakkan di atas salmon bersama daun bawang."},{"step":3,"text":"Kukus 12–15 menit hingga matang."},{"step":4,"text":"Sirami kecap ikan dan lemon saat sajikan."}]',
 5, 15, ARRAY['omega-3','high-protein','gluten-free']),

('Tempe Orek Rendah Minyak', 'dinner',
 'Tempe diiris tipis, dimasak kering dengan bumbu kecap rendah sodium — lauk tinggi protein nabati.',
 220, 18, 16, 10, 5, 4, 290, 1, 'porsi',
 '[{"item":"tempe","amount":"150g"},{"item":"bawang putih","amount":"3 siung"},{"item":"bawang merah","amount":"3 siung"},{"item":"kecap manis rendah sodium","amount":"1 sdm"},{"item":"cabai merah","amount":"1 buah"},{"item":"minyak kanola","amount":"1 sdt"}]',
 '[{"step":1,"text":"Iris tempe tipis-tipis."},{"step":2,"text":"Panaskan minyak, tumis bawang hingga harum."},{"step":3,"text":"Masukkan tempe, tumis hingga kecoklatan."},{"step":4,"text":"Tambahkan kecap dan cabai, aduk rata dan masak kering."}]',
 10, 15, ARRAY['high-protein','vegan','local-food']),

('Dada Ayam Bakar Bumbu Rempah', 'dinner',
 'Dada ayam tanpa kulit dibakar dengan marinasi rempah — protein tinggi, lemak rendah.',
 270, 42, 4, 9, 1, 2, 380, 1, 'porsi',
 '[{"item":"dada ayam tanpa kulit","amount":"200g"},{"item":"kunyit bubuk","amount":"½ sdt"},{"item":"ketumbar bubuk","amount":"1 sdt"},{"item":"bawang putih","amount":"3 siung"},{"item":"jahe","amount":"2 cm"},{"item":"perasan jeruk nipis","amount":"1 buah"},{"item":"minyak zaitun","amount":"1 sdt"}]',
 '[{"step":1,"text":"Haluskan semua bumbu, campurkan dengan minyak dan jeruk nipis."},{"step":2,"text":"Marinasi ayam minimal 30 menit di kulkas."},{"step":3,"text":"Bakar di grill pan 7 menit per sisi."}]',
 35, 15, ARRAY['high-protein','low-fat','gluten-free']),

('Tumis Tahu Paprika Colorful', 'dinner',
 'Tahu firm ditumis dengan paprika merah, kuning, hijau — kaya antioksidan dan protein nabati.',
 230, 16, 14, 13, 4, 6, 310, 1, 'porsi',
 '[{"item":"tahu firm","amount":"200g"},{"item":"paprika merah","amount":"½ buah"},{"item":"paprika kuning","amount":"½ buah"},{"item":"paprika hijau","amount":"½ buah"},{"item":"bawang bombay","amount":"½ buah"},{"item":"kecap asin rendah sodium","amount":"1 sdm"},{"item":"minyak wijen","amount":"1 sdt"}]',
 '[{"step":1,"text":"Potong tahu dan sayuran seukuran suap."},{"step":2,"text":"Goreng tahu hingga kecoklatan, sisihkan."},{"step":3,"text":"Tumis bawang bombay, masukkan paprika."},{"step":4,"text":"Masukkan tahu kembali, tambahkan kecap dan minyak wijen."}]',
 10, 15, ARRAY['vegan','high-protein','colorful']),

-- SNACK
('Edamame Rebus', 'snack',
 'Edamame kukus dengan sedikit garam laut — camilan tinggi protein dan serat.',
 120, 11, 10, 5, 5, 2, 180, 1, 'porsi',
 '[{"item":"edamame beku","amount":"150g"},{"item":"garam laut","amount":"¼ sdt"}]',
 '[{"step":1,"text":"Rebus atau kukus edamame 5 menit."},{"step":2,"text":"Tabur garam laut, sajikan hangat atau dingin."}]',
 1, 5, ARRAY['vegan','high-protein','low-calorie','portable']),

('Apel & Almond Butter', 'snack',
 'Apel segar dipotong dengan almond butter — kombinasi serat dan lemak sehat.',
 180, 4, 25, 9, 5, 17, 40, 1, 'porsi',
 '[{"item":"apel merah","amount":"1 buah"},{"item":"almond butter","amount":"1 sdm"}]',
 '[{"step":1,"text":"Potong apel menjadi irisan."},{"step":2,"text":"Sajikan bersama almond butter untuk dicocol."}]',
 3, 0, ARRAY['vegan','no-cook','portable','gluten-free']),

('Overnight Oat Chia', 'snack',
 'Oat dan biji chia direndam semalam dengan susu almond — siap makan tanpa masak.',
 240, 8, 38, 7, 8, 10, 90, 1, 'toples',
 '[{"item":"oat rolled","amount":"50g"},{"item":"biji chia","amount":"1 sdm"},{"item":"susu almond unsweetened","amount":"150ml"},{"item":"vanila ekstrak","amount":"¼ sdt"},{"item":"pisang","amount":"½ buah"}]',
 '[{"step":1,"text":"Campurkan oat, chia, susu almond, dan vanila dalam toples."},{"step":2,"text":"Tutup dan simpan di kulkas semalaman (minimal 6 jam)."},{"step":3,"text":"Saat makan, tambahkan irisan pisang di atasnya."}]',
 5, 0, ARRAY['vegan','meal-prep','high-fiber','no-cook']),

-- DRINK
('Infused Water Lemon Mint', 'drink',
 'Air infus lemon dan mint segar — menyegarkan dan membantu hidrasi tanpa kalori.',
 10, 0, 2, 0, 0, 1, 5, 500, 'ml',
 '[{"item":"lemon","amount":"½ buah, iris"},{"item":"daun mint segar","amount":"8 lembar"},{"item":"air putih dingin","amount":"500ml"},{"item":"es batu","amount":"secukupnya"}]',
 '[{"step":1,"text":"Masukkan irisan lemon dan daun mint ke dalam botol atau pitcher."},{"step":2,"text":"Tuang air dingin, masukkan es batu."},{"step":3,"text":"Diamkan 30 menit di kulkas agar rasa lebih keluar."}]',
 5, 0, ARRAY['vegan','zero-calorie','hydration','detox']),

('Jus Wortel Jeruk Jahe', 'drink',
 'Jus segar wortel, jeruk, dan jahe — kaya vitamin C dan beta-karoten untuk imunitas.',
 130, 2, 30, 1, 4, 20, 70, 300, 'ml',
 '[{"item":"wortel","amount":"2 buah"},{"item":"jeruk","amount":"2 buah"},{"item":"jahe","amount":"1 cm"},{"item":"air","amount":"50ml"}]',
 '[{"step":1,"text":"Peras jeruk, sisihkan."},{"step":2,"text":"Blender atau juice wortel dan jahe."},{"step":3,"text":"Campurkan jus wortel dengan perasan jeruk, aduk rata."}]',
 5, 0, ARRAY['vegan','immune-boost','no-added-sugar']),

('Susu Kedelai Vanilla Hangat', 'drink',
 'Susu kedelai unsweetened dengan vanila — alternatif susu nabati kaya protein.',
 100, 7, 8, 4, 1, 4, 90, 250, 'ml',
 '[{"item":"susu kedelai unsweetened","amount":"250ml"},{"item":"vanila ekstrak","amount":"¼ sdt"},{"item":"kayu manis","amount":"sejumput"}]',
 '[{"step":1,"text":"Panaskan susu kedelai hingga hangat (jangan mendidih)."},{"step":2,"text":"Tambahkan vanila dan kayu manis, aduk rata."},{"step":3,"text":"Sajikan dalam mug."}]',
 2, 3, ARRAY['vegan','low-calorie','dairy-free']),

('Smoothie Protein Coklat', 'drink',
 'Smoothie coklat dengan pisang, bubuk kakao, dan susu rendah lemak — post-workout terbaik.',
 280, 18, 40, 5, 5, 22, 130, 300, 'ml',
 '[{"item":"pisang beku","amount":"1 buah"},{"item":"susu rendah lemak","amount":"200ml"},{"item":"bubuk kakao tanpa gula","amount":"1 sdm"},{"item":"protein powder vanilla","amount":"1 scoop"},{"item":"es batu","amount":"3 butir"}]',
 '[{"step":1,"text":"Masukkan semua bahan ke blender."},{"step":2,"text":"Blender 60 detik hingga creamy."},{"step":3,"text":"Sajikan segera."}]',
 5, 0, ARRAY['high-protein','post-workout','vegetarian']),

('Air Kelapa Segar', 'drink',
 'Air kelapa muda alami — elektrolit alami, rendah kalori, sempurna untuk rehidrasi.',
 50, 1, 12, 0, 0, 10, 100, 250, 'ml',
 '[{"item":"air kelapa muda segar","amount":"250ml"}]',
 '[{"step":1,"text":"Buka kelapa muda segar."},{"step":2,"text":"Tuang air kelapa ke gelas, sajikan dingin atau dengan es."}]',
 2, 0, ARRAY['vegan','natural','electrolyte','gluten-free']);
