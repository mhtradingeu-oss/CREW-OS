"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createProduct } from "@/lib/api/product";
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
  sku: z.string().optional(),
  brandId: z.string().optional(),
  status: z.string().optional(),
});

export default function CreateProductPageClient() {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const router = useRouter();
  const { hasPermission } = useAuth();
  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (product) => {
      toast.success("Product created");
      router.push(`/dashboard/products/${product.id}`);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!hasPermission("product:create")) return <div>Access denied.</div>;

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Create Product</h1>
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input placeholder="product-slug" {...form.register("slug")} />
        </div>
        <div className="space-y-2">
          <Label>SKU</Label>
          <Input {...form.register("sku")} />
        </div>
        <div className="space-y-2">
          <Label>Brand ID</Label>
          <Input {...form.register("brandId")} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Input {...form.register("status")} />
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Create"}
        </Button>
      </form>
    </div>
  );
}
