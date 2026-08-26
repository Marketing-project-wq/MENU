const Joi = require('joi');
const { supabase } = require('../lib/supabase');

const favoriteSchema = Joi.object({
  recipe_id: Joi.string().uuid().required(),
});

const logSchema = Joi.object({
  recipe_id: Joi.string().uuid().required(),
  servings: Joi.number().min(0.1).max(10).default(1),
  eaten_at: Joi.date().iso().default(() => new Date()),
});

async function toggleFavorite(req, res, next) {
  try {
    const { error: valError, value } = favoriteSchema.validate(req.body);
    if (valError) return res.status(400).json({ error: valError.details[0].message });

    const { recipe_id } = value;
    const user_id = req.user.id;

    // Check if recipe exists
    const { data: recipe } = await supabase
      .from('recipes')
      .select('id')
      .eq('id', recipe_id)
      .eq('is_active', true)
      .maybeSingle();

    if (!recipe) return res.status(404).json({ error: 'Resep tidak ditemukan.' });

    // Toggle: delete if exists, insert if not
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user_id)
      .eq('recipe_id', recipe_id)
      .maybeSingle();

    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
      return res.json({ favorited: false });
    }

    await supabase.from('favorites').insert({ user_id, recipe_id });
    res.status(201).json({ favorited: true });
  } catch (err) {
    next(err);
  }
}

async function logMeal(req, res, next) {
  try {
    const { error: valError, value } = logSchema.validate(req.body);
    if (valError) return res.status(400).json({ error: valError.details[0].message });

    const { recipe_id, servings, eaten_at } = value;
    const user_id = req.user.id;

    // Fetch recipe for calorie calculation
    const { data: recipe, error: recipeErr } = await supabase
      .from('recipes')
      .select('id, name, calories, protein_g, carbs_g, fat_g')
      .eq('id', recipe_id)
      .eq('is_active', true)
      .maybeSingle();

    if (recipeErr || !recipe) return res.status(404).json({ error: 'Resep tidak ditemukan.' });

    const entry = {
      user_id,
      recipe_id,
      servings,
      eaten_at,
      calories_logged: Math.round(recipe.calories * servings),
      protein_g_logged: parseFloat((recipe.protein_g * servings).toFixed(1)),
      carbs_g_logged: parseFloat((recipe.carbs_g * servings).toFixed(1)),
      fat_g_logged: parseFloat((recipe.fat_g * servings).toFixed(1)),
    };

    const { data, error } = await supabase.from('meal_logs').insert(entry).select().single();
    if (error) throw error;

    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const { page = 1, limit = 20, date } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('meal_logs')
      .select(`
        id, servings, eaten_at,
        calories_logged, protein_g_logged, carbs_g_logged, fat_g_logged,
        recipes ( id, name, category, image_url )
      `, { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('eaten_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (date) {
      const d = new Date(date);
      if (!isNaN(d)) {
        const start = new Date(d.setHours(0, 0, 0, 0)).toISOString();
        const end = new Date(d.setHours(23, 59, 59, 999)).toISOString();
        query = query.gte('eaten_at', start).lte('eaten_at', end);
      }
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      data,
      meta: { total: count, page: pageNum, limit: limitNum, total_pages: Math.ceil(count / limitNum) },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { toggleFavorite, logMeal, getHistory };
