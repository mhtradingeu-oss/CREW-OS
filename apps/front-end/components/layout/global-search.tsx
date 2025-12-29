import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";

type GlobalSearchProps = {
  className?: string;
  onSubmit?: (value: string) => void;
};

export function GlobalSearch({ className, onSubmit }: GlobalSearchProps) {
  const [value, setValue] = useState("");
  const router = useRouter();
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.(value);
          const q = value.trim();
          if (q) router.push(`/dashboard?search=${encodeURIComponent(q)}`);
        }}
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search brands, products, people..."
          className="pl-9"
        />
      </form>
    </div>
  );
}
