const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

class AuthController {
  async discordCallback(req, res) {
    try {
      if (!req.user) {
        return res.redirect('/auth/failure');
      }

      const token = jwt.sign(
        { userId: req.user.id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:4200'}/auth/success?token=${token}`);
    } catch (error) {
      console.error('Discord callback error:', error);
      res.redirect('/auth/failure');
    }
  }

  async getCurrentUser(req, res) {
    try {
      const user = await prisma().user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          discordUsername: true,
          discordAvatar: true,
          email: true,
          role: true,
          createdAt: true,
          lastLogin: true
        }
      });

      res.json(user);
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async logout(req, res) {
    try {
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async verifyToken(req, res) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ valid: false, error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma().user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          discordUsername: true,
          discordAvatar: true,
          role: true
        }
      });

      if (!user) {
        return res.status(401).json({ valid: false, error: 'User not found' });
      }

      res.json({ valid: true, user });
    } catch (error) {
      res.status(401).json({ valid: false, error: 'Invalid token' });
    }
  }
}

module.exports = new AuthController();