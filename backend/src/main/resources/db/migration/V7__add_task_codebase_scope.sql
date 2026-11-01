-- V7: Scope each task to a synthetic codebase and the files it is about.
-- Defaults let existing rows keep working. focus_files is comma-separated, like tags.
ALTER TABLE tasks ADD COLUMN codebase_key VARCHAR NOT NULL DEFAULT 'shopfront';
ALTER TABLE tasks ADD COLUMN focus_files TEXT NOT NULL DEFAULT '';
