-- V11: The senior dev's review of each push. One review per submission: a failed review is retried
-- on the same row, so our failures never cost the player an attempt.
CREATE TABLE reviews (
    id              BIGSERIAL     PRIMARY KEY,
    submission_id   BIGINT        NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    -- PENDING, RUNNING, DONE, FAILED. The DB review queue also schedules by it.
    status          VARCHAR(20)   NOT NULL,
    -- APPROVED or CHANGES_REQUESTED, set when DONE.
    verdict         VARCHAR(20),
    summary         VARCHAR(500),
    failure_count   INTEGER       NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMP     NOT NULL,
    created_at      TIMESTAMP     NOT NULL,
    started_at      TIMESTAMP,
    reviewed_at     TIMESTAMP,
    CONSTRAINT uq_reviews_submission UNIQUE (submission_id)
);

-- The worker takes the oldest due PENDING review.
CREATE INDEX ix_reviews_status_next_attempt ON reviews (status, next_attempt_at);

CREATE TABLE review_comments (
    id         BIGSERIAL     PRIMARY KEY,
    review_id  BIGINT        NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    path       VARCHAR(500)  NOT NULL,
    -- 1-based, in the pushed file: where the Review tab anchors the thread.
    line       INTEGER       NOT NULL,
    severity   VARCHAR(20)   NOT NULL,
    body       TEXT          NOT NULL
);

-- Task criteria are one newline-separated string, so each result is stored by its position.
CREATE TABLE review_criteria (
    id         BIGSERIAL  PRIMARY KEY,
    review_id  BIGINT     NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    position   INTEGER    NOT NULL,
    met        BOOLEAN    NOT NULL,
    CONSTRAINT uq_review_criteria_position UNIQUE (review_id, position)
);
