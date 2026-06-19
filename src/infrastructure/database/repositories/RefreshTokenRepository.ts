import { Pool } from "pg";
import type { IRefreshTokenRepository, RefreshTokenRecord } from "../../../application/ports/repositories/IRefreshTokenRepository";

export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private db: Pool) {}

  async create(record: Omit<RefreshTokenRecord, 'id'|'revoked'> & { revoked?: boolean }): Promise<RefreshTokenRecord> {
    const { rows } = await this.db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked) VALUES ($1,$2,$3,$4) RETURNING id, user_id AS "userId", token_hash AS "tokenHash", expires_at AS "expiresAt", revoked, created_at',
      [record.userId, record.tokenHash, record.expiresAt, record.revoked ?? false],
    );
    const r = rows[0];
    return { id: r.id, userId: r.userId, tokenHash: r.tokenHash, expiresAt: r.expiresAt, revoked: r.revoked };
  }

  async findByHash(hash: string): Promise<RefreshTokenRecord | null> {
    const { rows } = await this.db.query('SELECT id, user_id AS "userId", token_hash AS "tokenHash", expires_at AS "expiresAt", revoked FROM refresh_tokens WHERE token_hash = $1', [hash]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return { id: r.id, userId: r.userId, tokenHash: r.tokenHash, expiresAt: r.expiresAt, revoked: r.revoked };
  }

  async revoke(id: string): Promise<void> {
    await this.db.query('UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1', [id]);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [userId]);
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM refresh_tokens WHERE id = $1', [id]);
  }
}
