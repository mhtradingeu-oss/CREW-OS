import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export type HeaderActionProps = {
  onClick?: () => void;
  children: ReactNode;
  variant?: "secondary" | "default" | "outline";
};

export function HeaderAction({ onClick, children, variant = "secondary" }: HeaderActionProps) {
  return (
    <Button variant={variant} size="sm" onClick={onClick}>
      {children}
    </Button>
  );
}
