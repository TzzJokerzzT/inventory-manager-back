export const ROLES = {
  ADMIN: "admin",
  OPERADOR: "operador",
  SOLO_LECTURA: "solo_lectura",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];