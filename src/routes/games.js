const express = require('express');
const gameController = require('../controllers/gameController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateUUID } = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

const validateGame = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('teamSize').isInt({ min: 1, max: 10 }).withMessage('Team size must be between 1 and 10'),
  body('iconUrl').optional().isURL().withMessage('Icon URL must be valid'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be max 1000 characters')
];

router.get('/', gameController.getAllGames);

router.get('/:id', validateUUID, gameController.getGameById);

router.post('/', validateGame, authenticateToken, requireAdmin, gameController.createGame);

router.put('/:id', validateUUID, validateGame, authenticateToken, requireAdmin, gameController.updateGame);

router.delete('/:id', validateUUID, authenticateToken, requireAdmin, gameController.deleteGame);

router.patch('/:id/toggle-status', validateUUID, authenticateToken, requireAdmin, gameController.toggleGameStatus);

module.exports = router;