"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getUser, updateUser } from "@/lib/api/users";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { apiErrorMessage } from "@/lib/api/client";
import { updateUserSchema, type UpdateUserDto } from "@mh-os/shared";

export default function UserDetailPageClient() {
  const params = useParams();
  const userId = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUser(userId),
    enabled: Boolean(userId),
  });

  const form = useForm<UpdateUserDto>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { email: "", role: "", status: "", password: "" },
  });

  useEffect(() => {
    if (data) {
      form.reset({ email: data.email, role: data.role, status: data.status, password: "" });
    }
  }, [data, form]);

  const mutation = useMutation({
    mutationFn: (payload: UpdateUserDto) => updateUser(userId, payload),
    onSuccess: () => {
      toast.success("User updated");
      void queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!hasPermission(["users:read", "users:update"])) {
    return <div>Access denied.</div>;
  }

  if (isLoading || !data) return <div>Loading...</div>;

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{data.email}</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard/users")}>
          Back
        </Button>
      </div>
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" {...form.register("email")} />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" placeholder="••••••••" {...form.register("password")} />
          <p className="text-xs text-muted-foreground">Leave blank to keep the current password.</p>
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Input {...form.register("role")} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Input {...form.register("status")} />
        </div>
        {hasPermission("users:update") && (
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        )}
      </form>
    </div>
  );
}
