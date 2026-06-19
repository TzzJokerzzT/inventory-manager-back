import { Email } from "../value-objects/Email";

export class User {
  constructor(
    readonly id: string,
    readonly email: Email,
    passwordHash: string,
    name: string,
    roleId: string,
    active = true,
    readonly createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    this.passwordHash = passwordHash;
    this.name = name;
    this.roleId = roleId;
    this.active = active;
    this.updatedAt = updatedAt;
  }

  passwordHash: string;
  name: string;
  roleId: string;
  active: boolean;
  updatedAt: Date;

  isAdmin(): boolean {
    return this.roleId === "admin";
  }

  isOperator(): boolean {
    return this.roleId === "operador";
  }

  canPerform(action: string): boolean {
    if (!this.active) return false;
    if (this.isAdmin()) return true;
    if (this.isOperator()) {
      return ["create_product", "update_product", "create_movement"].includes(action);
    }
    return false;
  }
}
