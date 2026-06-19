export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
}

export interface IRefreshTokenRepository {
  create(record: Omit<RefreshTokenRecord, 'id'|'revoked'> & { revoked?: boolean }): Promise<RefreshTokenRecord>;
  findByHash(hash: string): Promise<RefreshTokenRecord | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
