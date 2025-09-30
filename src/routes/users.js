const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateUser, validateUUID } = require('../middleware/validation');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, userController.getAllUsers);

router.get('/me', authenticateToken, userController.getCurrentUserProfile);

router.get('/:id', validateUUID, authenticateToken, userController.getUserById);

router.put('/:id', validateUUID, validateUser, authenticateToken, userController.updateUser);

router.patch('/:id/role', validateUUID, authenticateToken, requireAdmin, userController.updateUserRole);

router.delete('/:id', validateUUID, authenticateToken, requireAdmin, userController.deleteUser);

router.get('/:id/stats', validateUUID, authenticateToken, userController.getUserStats);

module.exports = router;