export class Email {
  readonly value: string;

  constructor(email: string) {
    if (!Email.isValid(email)) {
      throw new Error(`Invalid email: ${email}`);
    }
    this.value = email.toLowerCase();
    Object.freeze(this);
  }

  static isValid(email: string): boolean {
    const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    return typeof email === "string" && re.test(email);
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.toString();
  }
}
