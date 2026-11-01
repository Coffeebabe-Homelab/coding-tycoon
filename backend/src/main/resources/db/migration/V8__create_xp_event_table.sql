-- V8: XP ledger, one row per award. The unique (task_id, reason) pair makes awarding idempotent.
CREATE TABLE xp_event (
    id                BIGSERIAL    PRIMARY KEY,
    player_profile_id BIGINT       NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    task_id           BIGINT       NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    amount            INTEGER      NOT NULL,
    reason            VARCHAR(50)  NOT NULL,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_xp_event_task_reason UNIQUE (task_id, reason)
);

CREATE INDEX idx_xp_event_player_profile_id ON xp_event (player_profile_id);
