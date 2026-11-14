-- V10: Pushes from the VCS panel. Full file contents are stored, not diffs: the reviewer needs whole files.
CREATE TABLE submissions (
    id                BIGSERIAL    PRIMARY KEY,
    task_id           BIGINT       NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    player_profile_id BIGINT       NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    attempt_number    INTEGER      NOT NULL,
    commit_message    VARCHAR(72)  NOT NULL,
    submitted_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    -- Also stops two simultaneous pushes from both becoming the same attempt.
    CONSTRAINT uq_submissions_task_attempt UNIQUE (task_id, attempt_number)
);

CREATE TABLE submission_files (
    id            BIGSERIAL     PRIMARY KEY,
    submission_id BIGINT        NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    path          VARCHAR(500)  NOT NULL,
    content       TEXT          NOT NULL,
    CONSTRAINT uq_submission_files_path UNIQUE (submission_id, path)
);
