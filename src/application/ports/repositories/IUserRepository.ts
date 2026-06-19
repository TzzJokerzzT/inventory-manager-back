import type { User } from "../../../domain/entities/User";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Partial<User>): Promise<User>;
  update(id: string, updates: Partial<User>): Promise<User | null>;
  softDelete(id: string): Promise<void>;
  findAll(): Promise<User[]>;
}
