-- ============================================
-- BASE DE DONNÉES - PLATEFORME TOURNOIS
-- ============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS TYPES
-- ============================================
DROP TYPE IF EXISTS "Role" CASCADE;
CREATE TYPE "Role" AS ENUM ('player', 'admin', 'moderator');

DROP TYPE IF EXISTS "TeamMemberRole" CASCADE;
CREATE TYPE "TeamMemberRole" AS ENUM ('captain', 'member', 'substitute');

DROP TYPE IF EXISTS "TournamentFormat" CASCADE;
CREATE TYPE "TournamentFormat" AS ENUM ('single_elimination', 'double_elimination', 'round_robin', 'swiss');

DROP TYPE IF EXISTS "TournamentStatus" CASCADE;
CREATE TYPE "TournamentStatus" AS ENUM ('draft', 'registration', 'ongoing', 'completed', 'cancelled');

DROP TYPE IF EXISTS "TournamentParticipantStatus" CASCADE;
CREATE TYPE "TournamentParticipantStatus" AS ENUM ('pending', 'confirmed', 'checked_in', 'disqualified', 'withdrawn');

DROP TYPE IF EXISTS "BracketType" CASCADE;
CREATE TYPE "BracketType" AS ENUM ('winner', 'loser', 'group');

DROP TYPE IF EXISTS "MatchStatus" CASCADE;
CREATE TYPE "MatchStatus" AS ENUM ('pending', 'ready', 'ongoing', 'completed', 'cancelled');

DROP TYPE IF EXISTS "AnnouncementType" CASCADE;
CREATE TYPE "AnnouncementType" AS ENUM ('registration_open', 'registration_close', 'match_ready', 'match_result', 'tournament_start', 'tournament_end', 'general');

-- ============================================
-- TABLE: users (Utilisateurs)
-- ============================================
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discord_id VARCHAR(100) UNIQUE NOT NULL,
    discord_username VARCHAR(100) NOT NULL,
    discord_discriminator VARCHAR(10),
    discord_avatar VARCHAR(255),
    email VARCHAR(255),
    role "Role" DEFAULT 'player',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- ============================================
-- TABLE: games (Jeux disponibles)
-- ============================================
DROP TABLE IF EXISTS games CASCADE;
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon_url VARCHAR(255),
    team_size INT NOT NULL DEFAULT 1, -- 1 pour solo, 5 pour LoL, etc.
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: teams (Équipes)
-- ============================================
DROP TABLE IF EXISTS teams CASCADE;
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    tag VARCHAR(10),
    logo_url VARCHAR(255),
    captain_id UUID REFERENCES users(id) ON DELETE SET NULL,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: team_members (Membres d'équipe)
-- ============================================
DROP TABLE IF EXISTS team_members CASCADE;
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role "TeamMemberRole" DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

-- ============================================
-- TABLE: tournaments (Tournois)
-- ============================================
DROP TABLE IF EXISTS tournaments CASCADE;
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    description TEXT,
    rules TEXT,
    format "TournamentFormat" NOT NULL,
    max_participants INT NOT NULL,
    team_size INT NOT NULL DEFAULT 1,
    status "TournamentStatus" DEFAULT 'draft',
    prize_pool VARCHAR(100),
    banner_url VARCHAR(255),
    
    -- Dates importantes
    registration_start TIMESTAMP,
    registration_end TIMESTAMP,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    
    -- Discord
    discord_channel_id VARCHAR(100),
    discord_role_id VARCHAR(100),
    
    -- Métadonnées
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: tournament_participants (Inscriptions)
-- ============================================
DROP TABLE IF EXISTS tournament_participants CASCADE;
CREATE TABLE tournament_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    seed INT, -- Pour le classement/tirage au sort
    status "TournamentParticipantStatus" DEFAULT 'pending',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checked_in_at TIMESTAMP,
    UNIQUE(tournament_id, user_id),
    UNIQUE(tournament_id, team_id),
    CHECK ((user_id IS NOT NULL AND team_id IS NULL) OR (user_id IS NULL AND team_id IS NOT NULL))
);

-- ============================================
-- TABLE: brackets (Structure du tournoi)
-- ============================================
DROP TABLE IF EXISTS brackets CASCADE;
CREATE TABLE brackets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    type "BracketType",
    name VARCHAR(100), -- "Groupe A", "Winner Bracket", etc.
    round_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: matches (Matchs)
-- ============================================
DROP TABLE IF EXISTS matches CASCADE;
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    bracket_id UUID REFERENCES brackets(id) ON DELETE CASCADE,
    round INT NOT NULL,
    match_number INT NOT NULL,

    -- Participants
    participant1_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
    participant2_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,

    -- Résultats
    winner_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
    score_participant1 INT DEFAULT 0,
    score_participant2 INT DEFAULT 0,

    -- Format
    best_of INT DEFAULT 1 CHECK (best_of IN (1, 3, 5, 7)),

    -- État
    status "MatchStatus" DEFAULT 'pending',
    
    -- Navigation dans le bracket
    next_match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    loser_next_match_id UUID REFERENCES matches(id) ON DELETE SET NULL, -- Pour double élimination
    
    -- Dates
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: match_games (Parties d'un match)
-- ============================================
DROP TABLE IF EXISTS match_games CASCADE;
CREATE TABLE match_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    game_number INT NOT NULL,
    winner_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
    score_participant1 INT,
    score_participant2 INT,
    details JSONB, -- Détails spécifiques au jeu (KDA, bans, etc.)
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: announcements (Annonces Discord)
-- ============================================
DROP TABLE IF EXISTS announcements CASCADE;
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    type "AnnouncementType" NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    discord_message_id VARCHAR(100),
    sent_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: notifications (Notifications utilisateurs)
-- ============================================
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES POUR PERFORMANCE
-- ============================================
DROP INDEX IF EXISTS idx_users_discord_id;
CREATE INDEX idx_users_discord_id ON users(discord_id);
DROP INDEX IF EXISTS idx_users_role;
CREATE INDEX idx_users_role ON users(role);

DROP INDEX IF EXISTS idx_teams_captain_id;
CREATE INDEX idx_teams_captain_id ON teams(captain_id);
DROP INDEX IF EXISTS idx_teams_game_id;
CREATE INDEX idx_teams_game_id ON teams(game_id);

DROP INDEX IF EXISTS idx_team_members_team_id;
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
DROP INDEX IF EXISTS idx_team_members_user_id;
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

DROP INDEX IF EXISTS idx_tournaments_game_id;
CREATE INDEX idx_tournaments_game_id ON tournaments(game_id);
DROP INDEX IF EXISTS idx_tournaments_status;
CREATE INDEX idx_tournaments_status ON tournaments(status);
DROP INDEX IF EXISTS idx_tournaments_start_date;
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);

DROP INDEX IF EXISTS idx_tournament_participants_tournament_id;
CREATE INDEX idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
DROP INDEX IF EXISTS idx_tournament_participants_user_id;
CREATE INDEX idx_tournament_participants_user_id ON tournament_participants(user_id);
DROP INDEX IF EXISTS idx_tournament_participants_team_id;
CREATE INDEX idx_tournament_participants_team_id ON tournament_participants(team_id);

DROP INDEX IF EXISTS idx_matches_tournament_id;
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
DROP INDEX IF EXISTS idx_matches_bracket_id;
CREATE INDEX idx_matches_bracket_id ON matches(bracket_id);
DROP INDEX IF EXISTS idx_matches_status;
CREATE INDEX idx_matches_status ON matches(status);
DROP INDEX IF EXISTS idx_matches_scheduled_at;
CREATE INDEX idx_matches_scheduled_at ON matches(scheduled_at);

DROP INDEX IF EXISTS idx_notifications_user_id;
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
DROP INDEX IF EXISTS idx_notifications_is_read;
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================
-- FONCTION: Mise à jour automatique updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tournaments_updated_at ON tournaments;
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONNÉES DE TEST
-- ============================================
DELETE FROM games WHERE slug IN ('lol', 'valorant', 'rocket-league', 'cs2', 'chess');
INSERT INTO games (name, slug, icon_url, team_size, description) VALUES
('League of Legends', 'lol', 'https://example.com/lol.png', 5, 'MOBA 5v5'),
('Valorant', 'valorant', 'https://example.com/valorant.png', 5, 'FPS tactique 5v5'),
('Rocket League', 'rocket-league', 'https://example.com/rl.png', 3, 'Football avec des voitures'),
('Counter-Strike 2', 'cs2', 'https://example.com/cs2.png', 5, 'FPS compétitif 5v5'),
('Chess', 'chess', 'https://example.com/chess.png', 1, 'Jeu d''échecs en solo');

COMMENT ON TABLE users IS 'Utilisateurs avec authentification Discord';
COMMENT ON TABLE tournaments IS 'Tournois multigaming avec différents formats';
COMMENT ON TABLE matches IS 'Matchs individuels dans les tournois';
COMMENT ON TABLE brackets IS 'Structure des brackets (simple/double élimination, groupes)';