export interface IJwtService {
  sign(payload: object, opts?: { expiresIn?: string }): Promise<string>;
  verify<T>(token: string): Promise<T>;
  refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
}
