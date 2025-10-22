-- Create a test user for login testing
-- Email: test@erecord.com
-- Password: Test@123456 (you'll need to set this in Supabase Auth)
-- Role: student

INSERT INTO users (id, email, full_name, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@erecord.com',
  'Test Student',
  'student',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Also create a lecturer test user
INSERT INTO users (id, email, full_name, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'lecturer@erecord.com',
  'Test Lecturer',
  'lecturer',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Also create an admin test user
INSERT INTO users (id, email, full_name, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'admin@erecord.com',
  'Test Admin',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
