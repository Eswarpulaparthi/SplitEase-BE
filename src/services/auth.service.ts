export class AuthService {
  public sanitized(base: string): string {
    return base.toLowerCase().replace(/[^a-z0-9_]/g, "");
  }

  public generateUniqueUsername(base: string): string {
    return `${base}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }
}
