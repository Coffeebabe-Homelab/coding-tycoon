-- V9: A player can have at most one active (non-APPROVED) task.
-- A race could create duplicates. The app always showed the newest, so older active ones are unreachable: remove them.
-- XP events only exist for approved tasks, so no XP is lost.
DELETE FROM tasks older
USING tasks newer
WHERE older.player_profile_id = newer.player_profile_id
  AND older.status <> 'APPROVED'
  AND newer.status <> 'APPROVED'
  AND (older.created_at, older.id) < (newer.created_at, newer.id);

CREATE UNIQUE INDEX uq_tasks_one_active_per_profile ON tasks (player_profile_id) WHERE status <> 'APPROVED';
