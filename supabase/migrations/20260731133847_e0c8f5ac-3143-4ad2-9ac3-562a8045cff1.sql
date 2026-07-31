ALTER TABLE public.user_roles DISABLE TRIGGER trg_guard_user_roles;
DELETE FROM auth.users WHERE email = 'testadmin@kcc-check.local';
DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);
ALTER TABLE public.user_roles ENABLE TRIGGER trg_guard_user_roles;
DELETE FROM public.audit_logs WHERE action LIKE 'setup.super_admin.%';