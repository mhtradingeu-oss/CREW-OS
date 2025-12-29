// V1 PLACEHOLDER — EXECUTION DISABLED
// All API logic is disabled for V1 read-only build.


export interface UserDto {
  id: string;
  email: string;
  role: string;
  status: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export async function listUsers(params?: Record<string, unknown>): Promise<UserDto[]> {
  return [];
}

export async function getUser(_id: string): Promise<UserDto | null> {
  return null;
}

export async function createUser(_payload: { email: string; password: string; role?: string; status?: string }): Promise<null> {
  return null;
}

export async function updateUser(_id: string, _payload: Partial<{ email: string; password: string; role?: string; status?: string }>): Promise<null> {
  return null;
}

export async function removeUser(id: string) {
  await api.delete(`/users/${id}`);
  return true;
}
