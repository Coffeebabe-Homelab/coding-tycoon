-- V3: Create the player_profiles table.
-- One profile per user (UNIQUE on user_id). Defaults match the onboarding wizard defaults.
CREATE TABLE player_profiles (
    id        BIGSERIAL   PRIMARY KEY,
    user_id   BIGINT      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    language  VARCHAR(50) NOT NULL DEFAULT 'Java',
    framework VARCHAR(50) NOT NULL DEFAULT 'Spring Boot',
    seniority VARCHAR(50) NOT NULL DEFAULT 'Junior'
);
