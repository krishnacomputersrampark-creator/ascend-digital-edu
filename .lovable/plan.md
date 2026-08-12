# Plan - Root Authentication Fix

The Krishna Computer Center ERP is currently suffering from a central authentication failure where protected operations return `UNAUTHORIZED: Invalid token`. This audit has identified that while the browser has a valid Supabase session, the server-side `requireSupabaseAuth` middleware fails to validate the token or correctly establish the authenticated context because the browser is not consistently attaching the `Authorization: Bearer <token>` header to TanStack Start `createServerFn` calls.

## User Review Required

> [!IMPORTANT]
> This fix will centrally repair the authentication bridge between the browser and the server. It will not change your existing roles, login credentials, or database data.

- **Check**: Are there any custom modifications to `src/start.ts` that I should be aware of? I will be ensuring the `attachSupabaseAuth` middleware is correctly registered there.
- **Verification**: After this fix, I will verify the Super Admin can perform CRUD operations on Students, Teachers, and Courses.

## Proposed Changes

### 1. Central Authentication & Middleware
- **Browser-to-Server Bridge**: Verify and ensure `src/start.ts` correctly registers the `attachSupabaseAuth` middleware in the `functionMiddleware` array. This is the root cause: without this, the browser never sends the JWT to the server.
- **Token Consistency**: Update `src/integrations/supabase/auth-attacher.ts` to use `supabase.auth.getSession()` more robustly, ensuring it always grabs the most current token from memory/storage.
- **Server-Side Validation**: Patch `src/integrations/supabase/auth-middleware.ts` to provide better internal diagnostics (e.g., logging whether a token was missing vs. malformed) to the server logs while maintaining strict security.

### 2. ERP Module Alignment
- **Global Context Adoption**: Audit all `*.functions.ts` files to ensure they *only* use `context.supabase` provided by the middleware for authenticated operations, rather than the singleton `supabase` client from `@/integrations/supabase/client` which lacks the request-specific token in a server environment.
- **Settings Repository**: Fix `src/lib/settings.repo.ts` to stop using the raw `supabase` client for mutations. It currently bypasses the middleware context, causing RLS failures.

### 3. Verification & QA
- **Auth Audit**: Use Playwright to log in as Super Admin and attempt to "Create Student" and "Save Settings".
- **RLS Check**: Confirm `auth.uid()` is correctly populated in the server-side client.

## Technical Details

- **File Modifications**:
    - `src/start.ts`: Register global middleware.
    - `src/integrations/supabase/auth-middleware.ts`: Improve token extraction and error reporting.
    - `src/lib/settings.repo.ts`: Refactor to use authenticated context or server-side admin for mutations.
    - `src/lib/students.functions.ts` (and others): Standardize on `context.supabase`.
- **Infrastructure**: This fix relies on TanStack Start's `createMiddleware` pattern to propagate the Bearer token in the `Authorization` header.
