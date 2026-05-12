import assert from "node:assert/strict";
import test from "node:test";

import { registerEmailUser } from "../src/lib/registration.ts";

function createDependencies(existingUser = null) {
  const sentEmails = [];
  const createdUsers = [];

  return {
    sentEmails,
    createdUsers,
    deps: {
      findUserByEmail: async (email) => existingUser && existingUser.email === email ? existingUser : null,
      createUser: async (data) => {
        createdUsers.push(data);
        return { id: "user_1", ...data };
      },
      hashPassword: async (password) => `hashed:${password}`,
      createToken: () => "verify_token",
      sendVerificationEmail: async (payload) => {
        sentEmails.push(payload);
      },
      now: () => new Date("2026-05-07T00:00:00.000Z"),
      appUrl: "https://example.com",
    },
  };
}

test("registerEmailUser creates an unverified account and sends a verification email", async () => {
  const { deps, createdUsers, sentEmails } = createDependencies();

  const result = await registerEmailUser({
    email: " USER@Example.COM ",
    password: "secret123",
    name: "  Alice  ",
  }, deps);

  assert.equal(result.ok, true);
  assert.equal(result.user.email, "user@example.com");
  assert.equal(createdUsers[0].email, "user@example.com");
  assert.equal(createdUsers[0].name, "Alice");
  assert.equal(createdUsers[0].password, "hashed:secret123");
  assert.equal(createdUsers[0].emailVerified, null);
  assert.equal(createdUsers[0].verificationToken, "verify_token");
  assert.equal(createdUsers[0].verificationExpires.toISOString(), "2026-05-08T00:00:00.000Z");
  assert.equal(sentEmails[0].to, "user@example.com");
  assert.equal(sentEmails[0].verificationUrl, "https://example.com/api/auth/verify-email?token=verify_token");
});

test("registerEmailUser rejects invalid input before creating a user", async () => {
  const { deps, createdUsers, sentEmails } = createDependencies();

  const badEmail = await registerEmailUser({ email: "bad", password: "secret123" }, deps);
  const weakPassword = await registerEmailUser({ email: "user@example.com", password: "123" }, deps);

  assert.deepEqual(badEmail, { ok: false, status: 400, error: "请输入有效邮箱" });
  assert.deepEqual(weakPassword, { ok: false, status: 400, error: "密码至少8位" });
  assert.equal(createdUsers.length, 0);
  assert.equal(sentEmails.length, 0);
});

test("registerEmailUser rejects an existing email", async () => {
  const { deps, createdUsers, sentEmails } = createDependencies({ email: "user@example.com" });

  const result = await registerEmailUser({ email: "USER@example.com", password: "secret123" }, deps);

  assert.deepEqual(result, { ok: false, status: 400, error: "该邮箱已注册" });
  assert.equal(createdUsers.length, 0);
  assert.equal(sentEmails.length, 0);
});
