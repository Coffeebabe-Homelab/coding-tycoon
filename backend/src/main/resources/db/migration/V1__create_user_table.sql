-- V1: Create the users table.
-- Every player record references Auth0 via the unique sub claim.
CREATE TABLE users (
    id         BIGSERIAL    PRIMARY KEY,
    sub        VARCHAR(255) NOT NULL UNIQUE,
    email      VARCHAR(255),
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
