const express = require('express');
const passport = require('../config/passport');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/auth/failure' }),
  authController.discordCallback
);

router.get('/me', authenticateToken, authController.getCurrentUser);

router.post('/logout', authenticateToken, authController.logout);

router.post('/verify', authController.verifyToken);

router.get('/failure', (req, res) => {
  res.status(401).json({ error: 'Authentication failed' });
});

module.exports = router;