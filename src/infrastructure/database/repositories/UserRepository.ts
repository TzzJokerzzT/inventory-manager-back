import { Pool } from "pg";
import type { IUserRepository } from "../../../application/ports/repositories/IUserRepository";
import { User } from "../../../domain/entities/User";
import { Email } from "../../../domain/value-objects/Email";

export class UserRepository implements IUserRepository {
  constructor(private db: Pool) {}

  async findById(id: string): Promise<User | null> {
    const { rows } = await this.db.query(
      'SELECT id, email, password_hash, name, role_id, active, created_at, updated_at FROM users WHERE id = $1',
      [id],
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return new User(r.id, new Email(r.email), r.password_hash, r.name, r.role_id, r.active, r.created_at, r.updated_at);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return new User(r.id, new Email(r.email), r.password_hash, r.name, r.role_id, r.active, r.created_at, r.updated_at);
  }

  async create(user: Partial<User>): Promise<User> {
    const { rows } = await this.db.query(
      'INSERT INTO users (email, password_hash, name, role_id, active) VALUES ($1,$2,$3,$4,$5) RETURNING id, email, password_hash, name, role_id, active, created_at, updated_at',
      [user.email?.toString(), user.passwordHash, user.name, user.roleId, user.active ?? true],
    );
    const r = rows[0];
    return new User(r.id, new Email(r.email), r.password_hash, r.name, r.role_id, r.active, r.created_at, r.updated_at);
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.passwordHash !== undefined) {
      fields.push(`password_hash = $${idx++}`);
      values.push(updates.passwordHash);
    }
    if (updates.active !== undefined) {
      fields.push(`active = $${idx++}`);
      values.push(updates.active);
    }
    if (updates.roleId !== undefined) {
      fields.push(`role_id = $${idx++}`);
      values.push(updates.roleId);
    }
    if (fields.length === 0) return this.findById(id);

    const q = `UPDATE users SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING id, email, password_hash, name, role_id, active, created_at, updated_at`;
    values.push(id);
    const { rows } = await this.db.query(q, values);
    if (rows.length === 0) return null;
    const r = rows[0];
    return new User(r.id, new Email(r.email), r.password_hash, r.name, r.role_id, r.active, r.created_at, r.updated_at);
  }

  async softDelete(id: string): Promise<void> {
    await this.db.query(`UPDATE users SET active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
  }

  async findAll(): Promise<User[]> {
    const { rows } = await this.db.query(`SELECT id, email, password_hash, name, role_id, active, created_at, updated_at FROM users`);
    return rows.map((r: any) => new User(r.id, new Email(r.email), r.password_hash, r.name, r.role_id, r.active, r.created_at, r.updated_at));
  }
}
