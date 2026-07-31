DELETE FROM auth.users WHERE id IN (
  '14adf955-8801-4231-a71e-4ce038f819cd',
  'c80c9fb7-5da7-4a8f-a8aa-64e2f65e3024',
  '9384fbb0-cf20-4daf-abc0-cd51274ef7ae',
  '9d5ff222-62b3-46c9-ba0f-5f4fded38f09'
);
DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);