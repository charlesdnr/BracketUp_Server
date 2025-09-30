const teamService = require('../services/teamService');

class TeamController {
  async getAllTeams(req, res) {
    try {
      const gameId = req.query.gameId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await teamService.getAllTeams(gameId, page, limit);
      res.json(result);
    } catch (error) {
      console.error('Get all teams error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getTeamById(req, res) {
    try {
      const { id } = req.params;
      const team = await teamService.getTeamById(id);
      res.json(team);
    } catch (error) {
      if (error.message === 'Team not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Get team by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createTeam(req, res) {
    try {
      const team = await teamService.createTeam(req.body, req.user.id);
      res.status(201).json(team);
    } catch (error) {
      if (error.message === 'Game not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'A team with this name already exists for this game') {
        return res.status(409).json({ error: error.message });
      }
      console.error('Create team error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateTeam(req, res) {
    try {
      const { id } = req.params;
      const team = await teamService.updateTeam(id, req.body, req.user.id);
      res.json(team);
    } catch (error) {
      if (error.message === 'Team not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Only team captain can update team') {
        return res.status(403).json({ error: error.message });
      }
      console.error('Update team error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteTeam(req, res) {
    try {
      const { id } = req.params;
      const result = await teamService.deleteTeam(id, req.user.id);
      res.json(result);
    } catch (error) {
      if (error.message === 'Team not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Only team captain can delete team') {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'Cannot delete team with tournament registrations') {
        return res.status(409).json({ error: error.message });
      }
      console.error('Delete team error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async addMember(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const team = await teamService.addMember(id, userId, req.user.id);
      res.json(team);
    } catch (error) {
      if (error.message === 'Team not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Only team captain can add members') {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'Team is full' || error.message === 'User is already a member of this team') {
        return res.status(409).json({ error: error.message });
      }
      console.error('Add member error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async removeMember(req, res) {
    try {
      const { id, userId } = req.params;
      const team = await teamService.removeMember(id, userId, req.user.id);
      res.json(team);
    } catch (error) {
      if (error.message === 'Team not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Only team captain or the member themselves can remove member') {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'Captain cannot be removed. Transfer captaincy first') {
        return res.status(409).json({ error: error.message });
      }
      console.error('Remove member error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async transferCaptaincy(req, res) {
    try {
      const { id } = req.params;
      const { newCaptainId } = req.body;
      const team = await teamService.transferCaptaincy(id, newCaptainId, req.user.id);
      res.json(team);
    } catch (error) {
      if (error.message === 'Team not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Only current captain can transfer captaincy') {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'New captain must be a team member') {
        return res.status(409).json({ error: error.message });
      }
      console.error('Transfer captaincy error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new TeamController();