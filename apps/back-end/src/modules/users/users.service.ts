/**
 * USERS SERVICE — MH-OS v2
 * Spec: docs/01_system_overview.md (MASTER_INDEX)
 */
import {
  createUser,
  findUsers,
  findUserById,
  updateUser,
  updateUserStatus,
  updateUserRole,
  userSelect,
} from "../../core/db/repositories/users.repository.js";
import type { SelectedUser } from "../../core/db/repositories/users.repository.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import { hashPassword } from "../../core/security/password.js";
import { resolvePermissionsForRoleSet } from "../../core/security/rbac.js";
import { buildPagination } from "../../core/utils/pagination.js";
import { emitUserCreated, emitUserDeleted, emitUserUpdated } from "./users.events.js";
import type {
  CreateUserInput,
  ListUsersParams,
  PaginatedUsers,
  UpdateUserInput,
  UserRecord,
  UserRoleInfo,
} from "@mh-os/shared";

type UserUpdatePayload = {
  email?: string;
  password?: string;
  role?: string;
  status?: string;
};

type FindUsersArgs = NonNullable<Parameters<typeof findUsers>[0]>;
type UserWhereInput = NonNullable<FindUsersArgs["where"]>;
type UpdateUserArgs = Parameters<typeof updateUser>[1];

class UsersService {
  constructor() {}

  async list(params: ListUsersParams = {}): Promise<PaginatedUsers> {
    const { search, role, status, page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });

    const where: UserWhereInput = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { role: { contains: search, mode: "insensitive" } },
        { status: { contains: search, mode: "insensitive" } },
      ];
    }

    // Use repository for user queries
    const users = await findUsers({
      where,
      select: userSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
    // Count total users (repository can be extended for count if needed)
    const total = users.length < take ? users.length : await findUsers({ where }).then(u => u.length);

    const roleDetails = await this.fetchRoleDetails(users.map((user) => user.role));
    const items = await Promise.all(users.map((user) => this.attachPermissions(user, roleDetails)));

    return {
      items,
      total,
      page,
      pageSize: take,
    };
  }

  async getById(id: string): Promise<UserRecord> {
    const user = await findUserById(id, userSelect);
    if (!user) {
      throw notFound("User not found");
    }
    const roleDetails = await this.fetchRoleDetails([user.role]);
    return this.attachPermissions(user, roleDetails);
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const users = await findUsers({ where: { email: input.email } });
    const existing = users[0];
    if (existing) {
      throw badRequest("Email already in use");
    }

    const role = input.role ?? "USER";
    await this.ensureRole(role);

    const passwordHash = await hashPassword(input.password);
    // Use repository for user creation
    const user = await createUser({
      email: input.email,
      password: passwordHash,
      role,
      status: input.status ?? "ACTIVE",
    });

    await emitUserCreated({ id: user.id, email: user.email });
    const roleDetails = await this.fetchRoleDetails([user.role]);
    return this.attachPermissions(user, roleDetails);
  }

  async update(id: string, input: UpdateUserInput): Promise<UserRecord> {
    const user = await findUserById(id);
    if (!user) {
      throw notFound("User not found");
    }

    const updates: UpdateUserArgs = {};

    if (input.email && input.email !== user.email) {
      const emailUsers = await findUsers({ where: { email: input.email } });
      const emailOwner = emailUsers[0];
      if (emailOwner && emailOwner.id !== id) {
        throw badRequest("Email already in use");
      }
      updates.email = input.email;
    }

    if (input.password) {
      updates.password = await hashPassword(input.password);
    }

    if (input.role && input.role !== user.role) {
      await this.ensureRole(input.role);
      updates.role = input.role;
    }

    if (input.status && input.status !== user.status) {
      updates.status = input.status;
    }

    if (Object.keys(updates).length === 0) {
      const roleDetails = await this.fetchRoleDetails([user.role]);
      return this.attachPermissions(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          rolesJson: user.rolesJson,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        roleDetails,
      );
    }

    const updated = await updateUser(id, updates);

    await emitUserUpdated({ id: updated.id, email: updated.email });
    const roleDetails = await this.fetchRoleDetails([updated.role]);
    return this.attachPermissions(updated, roleDetails);
  }

  async remove(id: string) {
    const user = await findUserById(id, { id: true, email: true });
    if (!user) {
      throw notFound("User not found");
    }

    // Implement delete in repository if needed, for now mimic behavior
    // await deleteUser(id);
    await emitUserDeleted({ id: user.id, email: user.email });
    return { id };
  }

  private async ensureRole(role: string) {
    // Implement role lookup in repository if needed
    // const roleRecord = await findRoleByName(role);
    // if (!roleRecord) {
    //   throw badRequest(`Role ${role} is not provisioned`);
    // }
  }

  private async fetchRoleDetails(roleNames: string[]): Promise<Map<string, UserRoleInfo | undefined>> {
    const uniqueRoles = Array.from(new Set(roleNames)).filter(Boolean);
    if (!uniqueRoles.length) return new Map();

    // Placeholder until role lookup is implemented
    return new Map(uniqueRoles.map((roleName) => [roleName, undefined]));
  }

  private async attachPermissions(user: SelectedUser, roleDetails: Map<string, UserRoleInfo | undefined>): Promise<UserRecord> {
    const { rolesJson, ...base } = user;
    const permissions = await resolvePermissionsForRoleSet(user.role, rolesJson);
    return {
      ...base,
      permissions,
      roleDetails: roleDetails.get(user.role) ?? undefined,
    };
  }
}

export const usersService = new UsersService();
