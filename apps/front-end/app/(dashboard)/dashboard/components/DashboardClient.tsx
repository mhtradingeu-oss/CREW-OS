"use client";

import Link from "next/link";

export default function DashboardClient() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600">
      <p className="text-sm font-semibold text-slate-900">Standard Dashboard</p>
      <p className="mt-2">
        Once you complete onboarding, your personalized summary will appear here. If you were redirected, finish the
        flow at <Link href="/onboarding/step1" className="font-semibold text-primary">/onboarding/step1</Link>.
      </p>
    </div>
  );
}
