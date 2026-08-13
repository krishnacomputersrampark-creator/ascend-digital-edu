# Plan: Security Audit & Fixes

Audit the `public.has_role` and `public.claim_super_admin` SECURITY DEFINER functions flagged by the Supabase linter.

## User Review Required

> [!IMPORTANT]
> This plan modifies database function permissions to restrict execution of SECURITY DEFINER functions to specific roles (authenticated/service_role), preventing anonymous exploitation of administrative logic.

- Revoking public execution permissions on sensitive functions.
- Ensuring `claim_super_admin` is protected by internal checks or restricted access.

## Technical Details

### Security Definer Function Hardening
We will revoke default `EXECUTE` privileges on all `SECURITY DEFINER` functions from `PUBLIC` (which includes `anon`).

```sql
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
-- Grant back to specific roles
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_admission(jsonb) TO anon, authenticated, service_role; -- Public admission form
```

### Proposed Changes

#### Database Migrations
- `REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC`
- Targeted `GRANT EXECUTE` for functions that *must* be public (like `submit_admission`).
- Targeted `GRANT EXECUTE` for authenticated-only functions (like `has_role`, `update_my_student_profile`).

#### Application Logic
- No application logic changes required; the underlying functions remain the same, only their access level is tightened.
