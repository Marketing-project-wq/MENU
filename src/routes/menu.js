const router = require('express').Router();
const { optionalAuth, requireAuth } = require('../middleware/auth');
const recipesController = require('../controllers/recipesController');
const planController = require('../controllers/planController');
const memberController = require('../controllers/memberController');

// Guest routes — no login required
router.get('/recipes', optionalAuth, recipesController.list);
router.get('/recipes/:id', optionalAuth, recipesController.getById);
router.post('/generic-plan', optionalAuth, planController.genericPlan);

// Member-only routes
router.get('/personalized-plan', requireAuth, planController.personalizedPlan);
router.post('/favorite', requireAuth, memberController.toggleFavorite);
router.post('/log', requireAuth, memberController.logMeal);
router.get('/history', requireAuth, memberController.getHistory);

module.exports = router;
