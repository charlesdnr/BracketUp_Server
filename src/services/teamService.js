const { prisma } = require('../config/database');

class TeamService {
  async getAllTeams(gameId = null, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = gameId ? { gameId } : {};

    const [teams, total] = await Promise.all([
      prisma().team.findMany({
        where,
        skip,
        take: limit,
        include: {
          game: true,
          captain: {
            select: {
              id: true,
              discordUsername: true,
              discordAvatar: true
            }
          },
          _count: {
            select: {
              members: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma().team.count({ where })
    ]);

    return {
      teams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getTeamById(id) {
    const team = await prisma().team.findUnique({
      where: { id },
      include: {
        game: true,
        captain: {
          select: {
            id: true,
            discordUsername: true,
            discordAvatar: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                discordUsername: true,
                discordAvatar: true
              }
            }
          },
          orderBy: [
            { role: 'asc' },
            { joinedAt: 'asc' }
          ]
        },
        tournamentParticipants: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                status: true,
                startDate: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      throw new Error('Team not found');
    }

    return team;
  }

  async createTeam(data, userId) {
    const game = await prisma().game.findUnique({
      where: { id: data.gameId }
    });

    if (!game) {
      throw new Error('Game not found');
    }

    const existingTeam = await prisma().team.findFirst({
      where: {
        name: data.name,
        gameId: data.gameId
      }
    });

    if (existingTeam) {
      throw new Error('A team with this name already exists for this game');
    }

    const team = await prisma().$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name: data.name,
          tag: data.tag,
          logoUrl: data.logoUrl,
          gameId: data.gameId,
          captainId: userId
        }
      });

      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId: userId,
          role: 'CAPTAIN'
        }
      });

      return newTeam;
    });

    return await this.getTeamById(team.id);
  }

  async updateTeam(id, data, userId) {
    const team = await prisma().team.findUnique({
      where: { id }
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (team.captainId !== userId) {
      throw new Error('Only team captain can update team');
    }

    const updatedTeam = await prisma().team.update({
      where: { id },
      data: {
        name: data.name,
        tag: data.tag,
        logoUrl: data.logoUrl
      }
    });

    return await this.getTeamById(updatedTeam.id);
  }

  async deleteTeam(id, userId) {
    const team = await prisma().team.findUnique({
      where: { id },
      include: {
        tournamentParticipants: true
      }
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (team.captainId !== userId) {
      throw new Error('Only team captain can delete team');
    }

    if (team.tournamentParticipants.length > 0) {
      throw new Error('Cannot delete team with tournament registrations');
    }

    await prisma().team.delete({
      where: { id }
    });

    return { message: 'Team deleted successfully' };
  }

  async addMember(teamId, userId, requesterId) {
    const team = await prisma().team.findUnique({
      where: { id: teamId },
      include: {
        game: true,
        members: true
      }
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (team.captainId !== requesterId) {
      throw new Error('Only team captain can add members');
    }

    if (team.members.length >= team.game.teamSize) {
      throw new Error('Team is full');
    }

    const existingMember = await prisma().teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });

    if (existingMember) {
      throw new Error('User is already a member of this team');
    }

    await prisma().teamMember.create({
      data: {
        teamId,
        userId,
        role: 'MEMBER'
      }
    });

    return await this.getTeamById(teamId);
  }

  async removeMember(teamId, userId, requesterId) {
    const team = await prisma().team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (team.captainId !== requesterId && userId !== requesterId) {
      throw new Error('Only team captain or the member themselves can remove member');
    }

    if (team.captainId === userId) {
      throw new Error('Captain cannot be removed. Transfer captaincy first');
    }

    await prisma().teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });

    return await this.getTeamById(teamId);
  }

  async transferCaptaincy(teamId, newCaptainId, currentCaptainId) {
    const team = await prisma().team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (team.captainId !== currentCaptainId) {
      throw new Error('Only current captain can transfer captaincy');
    }

    const newCaptainMember = await prisma().teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: newCaptainId
        }
      }
    });

    if (!newCaptainMember) {
      throw new Error('New captain must be a team member');
    }

    await prisma().$transaction(async (tx) => {
      await tx.team.update({
        where: { id: teamId },
        data: { captainId: newCaptainId }
      });

      await tx.teamMember.update({
        where: {
          teamId_userId: {
            teamId,
            userId: currentCaptainId
          }
        },
        data: { role: 'MEMBER' }
      });

      await tx.teamMember.update({
        where: {
          teamId_userId: {
            teamId,
            userId: newCaptainId
          }
        },
        data: { role: 'CAPTAIN' }
      });
    });

    return await this.getTeamById(teamId);
  }
}

module.exports = new TeamService();