import Link from "next/link";
import DashboardClient from "./components/DashboardClient";
import { getCurrentUserPrimaryBrand } from "@/lib/api/user-brand";

export default async function DashboardPage() {
  const brandInfo = await getCurrentUserPrimaryBrand();

  if (!brandInfo.hasBrand) {
    return (
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-8 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">MH-OS Superapp</p>
        <h1 className="text-3xl font-semibold text-slate-900">Welcome to MH-OS</h1>
        <p className="text-sm text-slate-500">
          Start your AI onboarding wizard to create a brand, products, pricing, and marketing plans in minutes.
        </p>
        <Link
          href="/onboarding/step1"
          className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-900 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
        >
          Start AI Onboarding Wizard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardClient />
    </div>
  );
}
