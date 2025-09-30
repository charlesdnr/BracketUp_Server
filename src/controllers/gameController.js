const gameService = require('../services/gameService');

class GameController {
  async getAllGames(req, res) {
    try {
      const games = await gameService.getAllGames();
      res.json(games);
    } catch (error) {
      console.error('Get all games error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getGameById(req, res) {
    try {
      const { id } = req.params;
      const game = await gameService.getGameById(id);
      res.json(game);
    } catch (error) {
      if (error.message === 'Game not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Get game by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createGame(req, res) {
    try {
      const game = await gameService.createGame(req.body);
      res.status(201).json(game);
    } catch (error) {
      if (error.message === 'A game with this name already exists') {
        return res.status(409).json({ error: error.message });
      }
      console.error('Create game error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateGame(req, res) {
    try {
      const { id } = req.params;
      const game = await gameService.updateGame(id, req.body);
      res.json(game);
    } catch (error) {
      if (error.message === 'Game not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Update game error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteGame(req, res) {
    try {
      const { id } = req.params;
      const result = await gameService.deleteGame(id);
      res.json(result);
    } catch (error) {
      if (error.message === 'Game not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Cannot delete game with existing tournaments or teams') {
        return res.status(409).json({ error: error.message });
      }
      console.error('Delete game error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async toggleGameStatus(req, res) {
    try {
      const { id } = req.params;
      const game = await gameService.toggleGameStatus(id);
      res.json(game);
    } catch (error) {
      if (error.message === 'Game not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Toggle game status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new GameController();