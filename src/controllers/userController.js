const userService = require('../services/userService');

class UserController {
  async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      const result = await userService.getAllUsers(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      res.json(user);
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Get user by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;

      if (req.user.id !== id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Can only update own profile' });
      }

      const updatedUser = await userService.updateUser(id, req.body);
      res.json(updatedUser);
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['PLAYER', 'MODERATOR', 'ADMIN'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const updatedUser = await userService.updateUserRole(id, role);
      res.json(updatedUser);
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Update user role error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (req.user.id === id) {
        return res.status(400).json({ error: 'Cannot delete own account' });
      }

      const result = await userService.deleteUser(id);
      res.json(result);
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUserStats(req, res) {
    try {
      const { id } = req.params;
      const stats = await userService.getUserStats(id);
      res.json(stats);
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Get user stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCurrentUserProfile(req, res) {
    try {
      const user = await userService.getUserById(req.user.id);
      res.json(user);
    } catch (error) {
      console.error('Get current user profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new UserController();