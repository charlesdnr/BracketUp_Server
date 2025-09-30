const { prisma } = require('../config/database');

class UserService {
  async getAllUsers(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma().user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          discordUsername: true,
          discordAvatar: true,
          role: true,
          createdAt: true,
          lastLogin: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma().user.count()
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(id) {
    const user = await prisma().user.findUnique({
      where: { id },
      include: {
        captainTeams: {
          include: {
            game: true,
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    discordUsername: true,
                    discordAvatar: true
                  }
                }
              }
            }
          }
        },
        teamMemberships: {
          include: {
            team: {
              include: {
                game: true
              }
            }
          }
        },
        tournamentParticipants: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                status: true,
                game: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateUser(id, data) {
    const user = await prisma().user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma().user.update({
      where: { id },
      data: {
        discordUsername: data.discordUsername,
        email: data.email,
        updatedAt: new Date()
      },
      select: {
        id: true,
        discordUsername: true,
        discordAvatar: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }

  async updateUserRole(id, role) {
    const user = await prisma().user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma().user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        discordUsername: true,
        role: true
      }
    });

    return updatedUser;
  }

  async deleteUser(id) {
    const user = await prisma().user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new Error('User not found');
    }

    await prisma().user.delete({
      where: { id }
    });

    return { message: 'User deleted successfully' };
  }

  async getUserStats(id) {
    const user = await prisma().user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const [tournamentsParticipated, tournamentsWon, teamsCount] = await Promise.all([
      prisma().tournamentParticipant.count({
        where: { userId: id }
      }),
      prisma().match.count({
        where: {
          winnerId: {
            in: await prisma().tournamentParticipant.findMany({
              where: { userId: id },
              select: { id: true }
            }).then(participants => participants.map(p => p.id))
          }
        }
      }),
      prisma().teamMember.count({
        where: { userId: id }
      })
    ]);

    return {
      tournamentsParticipated,
      tournamentsWon,
      teamsCount
    };
  }
}

module.exports = new UserService();