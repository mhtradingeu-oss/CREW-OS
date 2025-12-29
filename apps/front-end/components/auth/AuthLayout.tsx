// AuthLayout.tsx
// Layout for all auth pages. Centers content, applies neutral background, and renders governance footer.
// No logic or state. UI only. See design rules in prompt.

import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100">
      <main className="flex flex-1 flex-col items-center justify-center w-full">
        {children}
      </main>
      <footer className="w-full py-4 text-center text-xs text-neutral-500 border-t border-neutral-200 mt-8">
        Authentication is governed. Execution disabled in V1.
      </footer>
    </div>
  );
}
