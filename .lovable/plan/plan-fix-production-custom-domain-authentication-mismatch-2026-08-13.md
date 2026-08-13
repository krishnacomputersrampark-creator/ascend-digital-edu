# Plan: Fix Production Custom Domain Authentication Mismatch

The goal is to resolve the `UNAUTHORIZED: Invalid token` error occurring specifically on the custom domain `www.krishnacomputercenter.com`.

## Audit Results
- **Lovable Domain (`ascend-digital-edu.lovable.app`)**: Served via Cloudflare. Auth works.
- **Custom Domain (`www.krishnacomputercenter.com`)**: Served via **Vercel**. Auth fails.
- **Root Cause**: The Vercel deployment is likely running an older build or has mismatched environment variables. Specifically, if the `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_URL` in Vercel's settings does not exactly match the one the browser is using, Supabase's `getClaims` will reject the token.

## Implementation Steps

### 1. Enhanced Debugging in Middleware
Add more descriptive error messages to the `requireSupabaseAuth` middleware to pinpoint if the failure is due to a key mismatch or an expired session.

### 2. Deployment Verification
The custom domain MUST be redeployed with the latest commit to ensure the TanStack Start `functionMiddleware` (which attaches the token) is active.

### 3. Supabase Redirect URL Audit
Ensure the Supabase dashboard "Redirect URLs" and "Site URL" include:
- `https://www.krishnacomputercenter.com`
- `https://krishnacomputercenter.com`
- `https://ascend-digital-edu.lovable.app`

## Technical Details
- **Middleware**: `src/integrations/supabase/auth-middleware.ts`
- **Client**: `src/integrations/supabase/client.ts`
- **Attacher**: `src/integrations/supabase/auth-attacher.ts`
- **Supabase Project**: `tjljtwdzextdnqefnbdh`

## Action Items for User
- **Vercel**: Go to Vercel dashboard and ensure the latest commit from the repository is deployed to the production custom domain.
- **Supabase**: Verify that the custom domain is listed in the Supabase Authentication settings.
- **Browser**: Clear cookies and local storage for `www.krishnacomputercenter.com` after the redeploy.
