# User Approval & Role Management

This module completes the registration workflow: every new account must be approved by an
administrator before it can access the ERP. It reuses the existing Lovable Cloud (Supabase)
auth, `profiles`, `user_roles`, `audit_logs` and `notifications` tables — no existing module
was changed.

## Super Admin bootstrap

- `/setup` is a one-time page. It calls `setupAvailable()` which checks `super_admin_exists()`.
- If a Super Admin already exists the page renders a permanent "setup completed" state and the
  `bootstrapSuperAdmin` server function refuses to run (server-side check, not just UI).
- Fields: Full Name, Email, Password, Confirm Password, Institute Name, Branch, Phone.
- The branch is created if it does not exist; the account is created confirmed, marked
  `approved`, and given the `super_admin` role. The event is written to `audit_logs`.

## Statuses

`pending` → `approved` | `rejected` | `suspended` | `inactive`

New sign-ups are always created as `role = guest`, `requested_role = student`, `status = pending`
by the `handle_new_user()` trigger.

## Login gating

`enforceApprovalAfterLogin()` (src/lib/approval.ts) calls the `record_login()` RPC, which stores
`last_login`, writes an audit entry and returns the status. Anything other than `approved`
signs the user back out and shows the matching message. Used by `/auth` and `/login`.

## Admin screens

- `/admin/users/pending` — pending registrations only.
- `/admin/users` — all users, with search (name / email / mobile) and filters (status, role, branch),
  pagination, skeleton loading and toasts.
- Actions: Approve (with role + branch), Reject (with reason), Suspend, Activate, Deactivate,
  Delete, Update Role.

## Security

All privileged operations are `SECURITY DEFINER` database functions, so the browser can never
write roles directly:

| Function | Purpose |
| --- | --- |
| `admin_approve_user(_uid,_role,_branch)` | Assign role + set status approved |
| `admin_assign_role(_uid,_role,_branch)` | Role change only |
| `admin_set_user_status(_uid,_status,_reason)` | Status change + notification |
| `admin_delete_user(_uid)` | Remove profile + roles |
| `record_login()` / `log_logout()` | Audit trail |
| `super_admin_exists()` | Bootstrap gate |

Guarantees enforced in SQL (and by the `guard_user_roles` trigger):

- Only Super Admin / Admin can call the admin functions.
- Only a Super Admin can create or modify another Super Admin.
- The last Super Admin cannot be demoted or deleted.
- No self-demotion, no self-status-change, no self-deletion.

## Notifications & audit

Every status change inserts a row into `notifications` targeted at the affected `user_id`, and an
entry in `audit_logs` (`user.registered`, `user.status.*`, `user.role.changed`, `user.deleted`,
`user.login`, `user.logout`, `setup.super_admin.created`).
Email/SMS delivery hooks live in `src/lib/notifications.stub.ts` for future integration.