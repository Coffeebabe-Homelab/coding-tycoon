-- V2: Create the topics table.
-- Topics are the canonical shared vocabulary for player preferences.
CREATE TABLE topics (
    id   BIGSERIAL    PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE
);
