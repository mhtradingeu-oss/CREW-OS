// AuthCard.tsx
// Card wrapper for auth forms. Uses shadcn/ui Card. No logic, UI only.

import * as React from "react";
// Update the import path below if Card is located elsewhere, e.g.:
import { Card } from "@/components/ui/card.tsx";
// Or, if Card is from shadcn/ui and you have it installed, use:
// import { Card } from "shadcn-ui";

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="w-full max-w-md mx-auto p-8 shadow-md border border-neutral-200 bg-white">
      {children}
    </Card>
  );
}
