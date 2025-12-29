import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

export const userSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  rolesJson: true,
} satisfies Prisma.UserSelect;

type UserSelectPayload<TSelect extends Prisma.UserSelect | undefined = undefined> = Prisma.UserGetPayload<{
  select: TSelect extends undefined ? typeof userSelect : TSelect;
}>;

export type SelectedUser = UserSelectPayload;

export async function findUsers(params: Prisma.UserFindManyArgs = {}): Promise<SelectedUser[]> {
  const { select, ...rest } = params;
  return prisma.user.findMany({
    ...rest,
    select: select ?? userSelect,
  });
}

export async function findUserById<TSelect extends Prisma.UserSelect | undefined>(
  id: string,
  select?: TSelect,
): Promise<UserSelectPayload<TSelect> | null> {
  const payload = await prisma.user.findUnique({
    where: { id },
    select: select ?? userSelect,
  });
  return payload as UserSelectPayload<TSelect> | null;
}

export async function createUser(data: Prisma.UserCreateInput): Promise<SelectedUser> {
  return prisma.user.create({
    data,
    select: userSelect,
  });
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput): Promise<SelectedUser> {
  return prisma.user.update({
    where: { id },
    data,
    select: userSelect,
  });
}

export async function updateUserStatus(id: string, status: string): Promise<SelectedUser> {
  return prisma.user.update({
    where: { id },
    data: { status },
    select: userSelect,
  });
}

export async function updateUserRole(id: string, role: string): Promise<SelectedUser> {
  return prisma.user.update({
    where: { id },
    data: { role },
    select: userSelect,
  });
}
