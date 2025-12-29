"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createBrand } from "@/lib/api/brand";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { apiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  defaultCurrency: z.string().length(3).optional(),
});

export default function CreateBrandPageClient() {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const router = useRouter();
  const { hasPermission } = useAuth();
  const mutation = useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      toast.success("Brand created");
      router.push("/dashboard/brands");
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!hasPermission("brand:create")) {
    return <div>Access denied.</div>;
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Create Brand</h1>
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input placeholder="my-brand" {...form.register("slug")} />
          <p className="text-xs text-muted-foreground">Lowercase with hyphens.</p>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input {...form.register("description")} />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <Input {...form.register("countryOfOrigin")} />
        </div>
        <div className="space-y-2">
          <Label>Default Currency</Label>
          <Input placeholder="USD" {...form.register("defaultCurrency")} />
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Create"}
        </Button>
      </form>
    </div>
  );
}
