// Reset Password Page UI (no logic, UI only)
// See prompt for design/tech rules. No backend, no state, no execution.

import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <form className="space-y-6" /* No logic: form is read-only placeholder */>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold mb-1">Reset password</h1>
            <p className="text-sm text-neutral-500">Enterprise-grade, AI-governed system</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" type="password" autoComplete="new-password" disabled /* No logic */ />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" disabled /* No logic */ />
            </div>
          </div>
          <Button className="w-full" disabled /* No logic */>Reset password</Button>
          <div className="text-xs text-neutral-400 text-center mt-2">
            {/* Success placeholder: would show after reset in real app */}
            Password reset successful (placeholder)
          </div>
          <Separator className="my-6" />
          <div className="text-xs text-neutral-400 text-center">
            {/* Governance visual cue is in AuthLayout footer */}
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
