import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;