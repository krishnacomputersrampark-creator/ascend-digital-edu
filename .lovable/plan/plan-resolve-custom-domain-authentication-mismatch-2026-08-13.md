# Plan: Resolve Custom Domain Authentication Mismatch

The ERP correctly authenticates on the Lovable domain (`ascend-digital-edu.lovable.app`) but fails with `Unauthorized: Invalid token` on the custom domain (`www.krishnacomputercenter.com`). The error `unrecognized JWT kid` and `algorithm ES256` indicates a JWT verification failure on the Vercel-hosted server side.

## Technical Findings
- **Server Mismatch**: Lovable domain is served by Cloudflare; custom domain is served by Vercel.
- **JWT Verification Failure**: The Vercel runtime is unable to verify the signature of JWTs issued by the Supabase project. This happens when the server's `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_URL` environment variables do not match the ones used to issue the token, or if the server is running an older build that lacks proper middleware registration.
- **Root Cause**: Stale deployment or mismatched environment variables in the Vercel dashboard.

## Proposed Actions

### 1. Environment & Deployment Verification
- **Vercel Settings**: Verify that `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the Vercel Production environment match the values in Lovable Cloud.
- **Build Refresh**: Trigger a fresh production deployment on Vercel to ensure the latest `src/start.ts` and `attachSupabaseAuth` middleware are active.

### 2. Supabase Configuration
- **Auth Redirects**: Confirm that `https://www.krishnacomputercenter.com` (and its `www` variant) are registered in the Supabase Dashboard under **Authentication > URL Configuration**.
- **CORS**: Ensure the custom domain is allowed in Supabase CORS settings.

### 3. Middleware Diagnostics
- The current `src/integrations/supabase/auth-middleware.ts` has been enhanced to log detailed verification errors. After redeployment to Vercel, these logs will confirm if the rejection is due to a key mismatch.

## Acceptance Criteria
- A Super Admin can log into `www.krishnacomputercenter.com` and successfully perform protected operations (e.g., Save Settings, Edit Profile).
- No `401 Unauthorized` errors occur on RPC calls (`/_serverFn`).
- Both domains behave identically.

## Verification Comparison Table

| Item | Lovable Domain | Custom Domain | Match? |
| :--- | :--- | :--- | :--- |
| **Server** | Cloudflare | Vercel | **NO** |
| **Supabase Project** | tjljtwdzextdnqefnbdh | tjljtwdzextdnqefnbdh | YES |
| **Auth Session** | Functional | Fails on Serverfn | **NO** |
| **JWT Verification** | Success | Failure (ES256 kid) | **NO** |
