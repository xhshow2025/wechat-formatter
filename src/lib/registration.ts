export interface RegisterEmailInput {
  email: string;
  password: string;
  name?: string;
}

export interface CreatedEmailUser {
  id: string;
  email: string;
  name?: string | null;
}

export interface RegisterEmailDeps {
  findUserByEmail(email: string): Promise<unknown | null>;
  createUser(data: {
    email: string;
    password: string;
    name: string;
    emailVerified: null;
    verificationToken: string;
    verificationExpires: Date;
  }): Promise<CreatedEmailUser>;
  deleteUserByEmail?(email: string): Promise<void>;
  hashPassword(password: string): Promise<string>;
  createToken(): string;
  sendVerificationEmail(payload: {
    to: string;
    name: string;
    verificationUrl: string;
  }): Promise<void>;
  now(): Date;
  appUrl: string;
}

export type RegisterEmailResult =
  | { ok: true; user: CreatedEmailUser }
  | { ok: false; status: number; error: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function buildVerificationUrl(appUrl: string, token: string): string {
  const baseUrl = appUrl.replace(/\/+$/, "");
  return `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

export async function registerEmailUser(
  input: RegisterEmailInput,
  deps: RegisterEmailDeps
): Promise<RegisterEmailResult> {
  const email = normalizeEmail(input.email || "");
  const password = input.password || "";
  const name = (input.name || "").trim();

  if (!emailPattern.test(email)) {
    return { ok: false, status: 400, error: "请输入有效邮箱" };
  }

  if (password.length < 8) {
    return { ok: false, status: 400, error: "密码至少8位" };
  }

  const existingUser = await deps.findUserByEmail(email);
  if (existingUser) {
    return { ok: false, status: 400, error: "该邮箱已注册" };
  }

  const verificationToken = deps.createToken();
  const verificationExpires = new Date(deps.now().getTime() + 24 * 60 * 60 * 1000);
  const hashedPassword = await deps.hashPassword(password);
  const user = await deps.createUser({
    email,
    password: hashedPassword,
    name,
    emailVerified: null,
    verificationToken,
    verificationExpires,
  });

  try {
    await deps.sendVerificationEmail({
      to: email,
      name,
      verificationUrl: buildVerificationUrl(deps.appUrl, verificationToken),
    });
  } catch (error) {
    if (deps.deleteUserByEmail) {
      await deps.deleteUserByEmail(email).catch(() => undefined);
    }
    throw error;
  }

  return { ok: true, user };
}
