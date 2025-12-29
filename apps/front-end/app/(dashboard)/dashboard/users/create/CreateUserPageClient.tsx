"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createUser } from "@/lib/api/users";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { apiErrorMessage } from "@/lib/api/client";
import { createUserSchema, type CreateUserDto } from "@mh-os/shared";

export default function CreateUserPageClient() {
  const form = useForm<CreateUserDto>({ resolver: zodResolver(createUserSchema) });
  const router = useRouter();
  const { hasPermission } = useAuth();
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success("User created");
      router.push("/dashboard/users");
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!hasPermission("users:create")) {
    return <div>You do not have permission to create users.</div>;
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Create User</h1>
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" {...form.register("password")} />
          {form.formState.errors.password && (
            <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Input placeholder="USER" {...form.register("role")} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Input placeholder="ACTIVE" {...form.register("status")} />
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Create"}
        </Button>
      </form>
    </div>
  );
}
