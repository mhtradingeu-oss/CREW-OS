import { ReactNode } from "react";
import MarketingLayout from "@/components/marketing/MarketingLayout";

export default function MarketingRootLayout({ children }: { children: ReactNode }) {
  return <MarketingLayout>{children}</MarketingLayout>;
}
