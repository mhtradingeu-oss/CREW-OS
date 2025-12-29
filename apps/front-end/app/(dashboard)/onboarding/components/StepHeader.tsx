import type { ReactNode } from "react";
import { PageHeader } from "@/components/shell/page-header";

interface StepHeaderProps {
  step: number;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function StepHeader({ step, title, description, actions }: StepHeaderProps) {
  return (
    <PageHeader
      title={`${step}. ${title}`}
      description={description}
      actions={actions}
    />
  );
}
