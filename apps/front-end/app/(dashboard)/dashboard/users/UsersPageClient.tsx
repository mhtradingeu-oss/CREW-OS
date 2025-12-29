"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listUsers, removeUser, type UserDto } from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";

export default function UsersPageClient() {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<keyof UserDto>("email");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const queryClient = useQueryClient();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["users", search, page, pageSize],
    queryFn: () => listUsers({ search: search || undefined, page, pageSize }),
  });

  const sortedData = useMemo(() => {
    if (!data?.data) return [];
    return [...data.data].sort((a, b) => {
      const aVal = (a[sortKey] ?? "") as string;
      const bVal = (b[sortKey] ?? "") as string;
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir]);

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeUser(id),
    onSuccess: () => {
      toast.success("User removed");
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const handleDelete = (user: UserDto) => {
    if (!hasPermission("users:delete")) return;
    if (confirm(`Delete ${user.email}?`)) {
      removeMutation.mutate(user.id);
    }
  };

  const toggleSort = (key: keyof UserDto) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Users</h1>
        {hasPermission("users:create") && (
          <Button onClick={() => router.push("/dashboard/users/create")}>Create user</Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Button
          variant="outline"
          onClick={() => void queryClient.invalidateQueries({ queryKey: ["users"] })}
        >
          Search
        </Button>
        <select
          className="rounded-md border border-input bg-background px-2 py-2 text-sm"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          {[10, 25, 50].map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          Loading users...
        </div>
      ) : isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load users: {apiErrorMessage(error)}
          <div>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : data && data.total === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          No users yet.{" "}
          {hasPermission("users:create") && (
            <Button
              variant="ghost"
              className="px-1 text-primary underline-offset-4 hover:underline"
              onClick={() => router.push("/dashboard/users/create")}
            >
              Create first user
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("email")}>
                  Email
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("role")}>
                  Role
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.status}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {hasPermission("users:read") && (
                      <Link href={`/dashboard/users/${user.id}`} className="text-primary text-sm">
                        View
                      </Link>
                    )}
                    {hasPermission("users:update") && (
                      <Link href={`/dashboard/users/${user.id}`} className="text-primary text-sm">
                        Edit
                      </Link>
                    )}
                    {hasPermission("users:delete") && (
                      <button
                        className="text-red-500 text-sm"
                        onClick={() => handleDelete(user)}
                        disabled={removeMutation.isPending}
                      >
                        Delete
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {data?.data.length ?? 0} of {data?.total ?? 0}
        </span>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => router.push(`/dashboard/users?page=${page - 1}`)}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data || data.total <= page * (data.pageSize ?? 0)}
            onClick={() => router.push(`/dashboard/users?page=${page + 1}`)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
