const Joi = require('joi');
const { getSupabase } = require('../lib/supabase');

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];

const genericPlanSchema = Joi.object({
  target_calories: Joi.number().min(500).max(5000).required(),
  days: Joi.number().integer().min(1).max(7).default(1),
});

function splitCalories(total) {
  return {
    breakfast: Math.round(total * 0.30),
    lunch:     Math.round(total * 0.35),
    dinner:    Math.round(total * 0.25),
    snack:     Math.round(total * 0.10),
  };
}

async function fetchBestMatch(category, targetCalories) {
  const { data } = await getSupabase()
    .from('recipes')
    .select('id, name, calories, protein_g, carbs_g, fat_g, image_url, prep_time_min')
    .eq('category', category)
    .eq('is_active', true)
    .gte('calories', targetCalories * 0.7)
    .lte('calories', targetCalories * 1.3)
    .limit(5);

  if (!data || data.length === 0) return null;

  return data.reduce((best, r) =>
    Math.abs(r.calories - targetCalories) < Math.abs(best.calories - targetCalories) ? r : best
  );
}

async function genericPlan(req, res, next) {
  try {
    const { error: valError, value } = genericPlanSchema.validate(req.body);
    if (valError) {
      return res.status(400).json({ error: valError.details[0].message });
    }

    const { target_calories, days } = value;
    const split = splitCalories(target_calories);
    const plan = [];

    for (let day = 1; day <= days; day++) {
      const meals = {};
      for (const meal of MEALS) {
        meals[meal] = await fetchBestMatch(meal, split[meal]);
      }
      plan.push({ day, meals });
    }

    res.json({
      data: { target_calories, days, calorie_split: split, plan },
      note: 'Meal plan generik berdasarkan target kalori. Login untuk plan personal yang disesuaikan dengan profil Anda.',
    });
  } catch (err) {
    next(err);
  }
}

async function personalizedPlan(req, res, next) {
  try {
    const { data: profile, error } = await getSupabase()
      .from('user_profiles')
      .select('target_calories, calories_consumed_today')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) throw error;

    const target = profile?.target_calories || 2000;
    const consumed = profile?.calories_consumed_today || 0;
    const remaining = Math.max(0, target - consumed);

    const split = splitCalories(remaining);
    const meals = {};
    for (const meal of MEALS) {
      meals[meal] = await fetchBestMatch(meal, split[meal]);
    }

    res.json({
      data: {
        target_calories: target,
        calories_consumed_today: consumed,
        remaining_calories: remaining,
        calorie_split: split,
        plan: [{ day: 1, meals }],
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { genericPlan, personalizedPlan };
