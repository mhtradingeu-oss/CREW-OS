import Link from "next/link";
import { Button } from "@/components/ui/button";

interface WizardNavProps {
  prevHref?: string;
  nextHref?: string;
  nextDisabled?: boolean;
  nextLabel?: string;
}

export function WizardNav({ prevHref, nextHref, nextDisabled, nextLabel = "Continue" }: WizardNavProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {prevHref ? (
        <Link href={prevHref} className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full">Back</Button>
        </Link>
      ) : null}
      {nextHref ? (
        <Link href={nextHref} className="flex-1 sm:flex-none">
          <Button className="w-full" disabled={nextDisabled}>{nextLabel}</Button>
        </Link>
      ) : null}
    </div>
  );
}
