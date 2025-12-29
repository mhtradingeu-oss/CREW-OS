// Login Page UI (no logic, UI only)
// See prompt for design/tech rules. No backend, no state, no execution.

import { AuthLayout, AuthCard } from "@/components/auth/index.ts";
import { Input, Label, Button, Separator } from "@/components/ui/index.ts";
import Link from "next/link";

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <form className="space-y-6" /* No logic: form is read-only placeholder */>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
            <p className="text-sm text-neutral-500">Enterprise-grade, AI-governed system</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" disabled /* No logic */ />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" disabled /* No logic */ />
            </div>
          </div>
          <Button className="w-full" disabled /* No logic */>Login</Button>
          <div className="flex justify-between items-center mt-2">
            <Link href="/forgot-password" className="text-xs text-blue-700 hover:underline">Forgot password?</Link>
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

