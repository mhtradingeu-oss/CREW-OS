import { Button } from "@/components/ui/button";

export default function CTAButton({ children, className = "", ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button className={`bg-blue-900 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg shadow ${className}`} {...props}>
      {children}
    </Button>
  );
}
