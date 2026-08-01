import { Link } from "@tanstack/react-router";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function SecurityNotice() {
  const { user } = useAuth();
  const mustChange = user?.user_metadata?.["must_change_password"] === true;
  if (!mustChange) return null;

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500 text-white">
          <ShieldAlert className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-amber-900">Security notice — change your password</p>
          <p className="text-xs text-amber-800">
            You are signed in with the default administrator password. Set a new password now to secure this account.
          </p>
        </div>
      </div>
      <Link
        to="/dashboard/settings/security"
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
      >
        Change Password <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
