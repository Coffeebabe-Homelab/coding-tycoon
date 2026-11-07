-- V6: Create the tasks table.
-- Each task is assigned to a player profile. Tags are stored as comma-separated TEXT for H2/PostgreSQL compatibility.
CREATE TABLE tasks (
    id                  BIGSERIAL     PRIMARY KEY,
    player_profile_id   BIGINT        NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    title               VARCHAR(255)  NOT NULL,
    description         TEXT          NOT NULL,
    acceptance_criteria TEXT          NOT NULL,
    difficulty          VARCHAR(50)   NOT NULL,
    tags                TEXT          NOT NULL DEFAULT '',
    status              VARCHAR(50)   NOT NULL DEFAULT 'ASSIGNED',
    created_at          TIMESTAMP     NOT NULL DEFAULT NOW()
);
