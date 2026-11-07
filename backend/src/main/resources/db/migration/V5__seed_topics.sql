-- V5: Seed the 5 initial topics used by the onboarding wizard.
INSERT INTO topics (name, slug) VALUES
    ('REST APIs',    'rest-apis'),
    ('CRUD',         'crud'),
    ('OOP',          'oop'),
    ('Clean Code',   'clean-code'),
    ('Git Workflow', 'git-workflow');
