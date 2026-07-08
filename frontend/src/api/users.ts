import { apiClient } from "@/api/client";
import type { UserRole } from "@/types/domain";

const USER_ADMIN_TIMEOUT_MS = 30000;

export interface ManagedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt?: string;
  lastSignInAt?: string;
}

export interface CreateManagedUserInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface UpdateManagedUserInput {
  email?: string;
  password?: string;
  fullName?: string;
  role?: UserRole;
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const response = await apiClient.get<ManagedUser[]>("/users", { timeout: USER_ADMIN_TIMEOUT_MS });
  return response.data;
}

export async function createManagedUser(input: CreateManagedUserInput): Promise<ManagedUser> {
  const response = await apiClient.post<ManagedUser>("/users", input, { timeout: USER_ADMIN_TIMEOUT_MS });
  return response.data;
}

export async function updateManagedUser(id: string, input: UpdateManagedUserInput): Promise<ManagedUser> {
  const response = await apiClient.patch<ManagedUser>(`/users/${encodeURIComponent(id)}`, input, {
    timeout: USER_ADMIN_TIMEOUT_MS,
  });
  return response.data;
}

export async function deleteManagedUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${encodeURIComponent(id)}`, { timeout: USER_ADMIN_TIMEOUT_MS });
}
