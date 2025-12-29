import { apiFetch } from "./client.ts";
import type { AuthSessionResponse, LoginDto, RegisterDto, ForgotPasswordDto } from "@mh-os/shared";


// V1: login is disabled (read-only build)
export async function login(_payload: LoginDto): Promise<null> {
  // V1 READ-ONLY STUB
  return null;
}


export async function me() {
  // V1 READ-ONLY: Only GET is supported
  const { data } = await apiFetch<AuthSessionResponse>("/auth/me");
  return data ?? null;
}


// V1: register is disabled (read-only build)
export async function register(_payload: RegisterDto): Promise<null> {
  // V1 READ-ONLY STUB
  return null;
}


// V1: password reset is disabled (read-only build)
export async function requestPasswordReset(_payload: ForgotPasswordDto): Promise<null> {
  // V1 READ-ONLY STUB
  return null;
}
