CREATE TABLE tournaments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'upcoming'
        CHECK (status IN ('upcoming', 'registration_open', 'in_progress', 'completed', 'cancelled')),
    starts_at TIMESTAMPTZ,
    registration_deadline TIMESTAMPTZ,
    max_teams INTEGER CHECK (max_teams IS NULL OR max_teams > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE teams (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE players (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    display_name TEXT NOT NULL CHECK (length(trim(display_name)) > 0),
    discord_id TEXT UNIQUE,
    steam_id TEXT UNIQUE,
    mmr INTEGER NOT NULL CHECK (mmr >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE team_members (
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
    position TEXT,
    is_captain BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (team_id, player_id),
    UNIQUE (player_id)
);

CREATE UNIQUE INDEX one_captain_per_team ON team_members(team_id) WHERE is_captain;

CREATE TABLE tournament_registrations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tournament_id BIGINT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tournament_id, team_id)
);

CREATE INDEX registrations_by_tournament ON tournament_registrations(tournament_id, status);
