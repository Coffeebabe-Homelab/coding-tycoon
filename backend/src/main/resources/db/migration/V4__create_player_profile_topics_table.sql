-- V4: Create the join table linking player profiles to topics (many-to-many).
CREATE TABLE player_profile_topics (
    profile_id BIGINT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    topic_id   BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, topic_id)
);
