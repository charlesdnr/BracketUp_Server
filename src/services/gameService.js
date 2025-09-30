const { prisma } = require('../config/database');

class GameService {
  async getAllGames() {
    const games = await prisma().game.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    return games;
  }

  async getGameById(id) {
    const game = await prisma().game.findUnique({
      where: { id },
      include: {
        tournaments: {
          where: { status: { not: 'CANCELLED' } },
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            maxParticipants: true,
            _count: {
              select: {
                participants: true
              }
            }
          },
          orderBy: { startDate: 'desc' }
        },
        teams: {
          select: {
            id: true,
            name: true,
            tag: true,
            logoUrl: true,
            _count: {
              select: {
                members: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!game) {
      throw new Error('Game not found');
    }

    return game;
  }

  async createGame(data) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existingGame = await prisma().game.findUnique({
      where: { slug }
    });

    if (existingGame) {
      throw new Error('A game with this name already exists');
    }

    const game = await prisma().game.create({
      data: {
        name: data.name,
        slug,
        iconUrl: data.iconUrl,
        teamSize: data.teamSize,
        description: data.description
      }
    });

    return game;
  }

  async updateGame(id, data) {
    const game = await prisma().game.findUnique({
      where: { id }
    });

    if (!game) {
      throw new Error('Game not found');
    }

    const updatedGame = await prisma().game.update({
      where: { id },
      data: {
        name: data.name,
        iconUrl: data.iconUrl,
        teamSize: data.teamSize,
        description: data.description,
        isActive: data.isActive
      }
    });

    return updatedGame;
  }

  async deleteGame(id) {
    const game = await prisma().game.findUnique({
      where: { id },
      include: {
        tournaments: true,
        teams: true
      }
    });

    if (!game) {
      throw new Error('Game not found');
    }

    if (game.tournaments.length > 0 || game.teams.length > 0) {
      throw new Error('Cannot delete game with existing tournaments or teams');
    }

    await prisma().game.delete({
      where: { id }
    });

    return { message: 'Game deleted successfully' };
  }

  async toggleGameStatus(id) {
    const game = await prisma().game.findUnique({
      where: { id }
    });

    if (!game) {
      throw new Error('Game not found');
    }

    const updatedGame = await prisma().game.update({
      where: { id },
      data: { isActive: !game.isActive }
    });

    return updatedGame;
  }
}

module.exports = new GameService();