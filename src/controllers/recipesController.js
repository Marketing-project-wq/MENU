const { supabase } = require('../lib/supabase');

const VALID_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack', 'drink'];

async function list(req, res, next) {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('recipes')
      .select('id, name, category, calories, protein_g, carbs_g, fat_g, image_url, prep_time_min', { count: 'exact' })
      .eq('is_active', true)
      .order('name')
      .range(offset, offset + limitNum - 1);

    if (category && VALID_CATEGORIES.includes(category)) {
      query = query.eq('category', category);
    }

    if (search && search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      data,
      meta: {
        total: count,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('recipes')
      .select(`
        id, name, category, description,
        calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg,
        serving_size, serving_unit,
        ingredients, steps,
        image_url, prep_time_min, cook_time_min,
        tags, is_active
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Resep tidak ditemukan.' });
    }

    // Attach favorite status if user is logged in
    let is_favorited = false;
    if (req.user) {
      const { data: fav } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('recipe_id', id)
        .maybeSingle();
      is_favorited = !!fav;
    }

    res.json({ data: { ...data, is_favorited } });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById };
