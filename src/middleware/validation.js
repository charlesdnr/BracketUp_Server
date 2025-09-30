const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const validateTournament = [
  body('name').trim().isLength({ min: 3, max: 200 }).withMessage('Name must be between 3 and 200 characters'),
  body('gameId').isUUID().withMessage('Valid game ID required'),
  body('format').isIn(['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS']).withMessage('Invalid format'),
  body('maxParticipants').isInt({ min: 2, max: 512 }).withMessage('Max participants must be between 2 and 512'),
  body('teamSize').isInt({ min: 1, max: 10 }).withMessage('Team size must be between 1 and 10'),
  body('registrationStart').optional().isISO8601().withMessage('Invalid registration start date'),
  body('registrationEnd').optional().isISO8601().withMessage('Invalid registration end date'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  handleValidationErrors
];

const validateTeam = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('tag').optional().trim().isLength({ max: 10 }).withMessage('Tag must be max 10 characters'),
  body('gameId').isUUID().withMessage('Valid game ID required'),
  handleValidationErrors
];

const validateUser = [
  body('discordUsername').trim().isLength({ min: 2, max: 100 }).withMessage('Username must be between 2 and 100 characters'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  handleValidationErrors
];

const validateUUID = [
  param('id').isUUID().withMessage('Valid UUID required'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateTournament,
  validateTeam,
  validateUser,
  validateUUID
};