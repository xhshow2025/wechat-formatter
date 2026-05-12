import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendVerificationEmailViaResend } from "@/lib/email"
import { registerEmailUser } from "@/lib/registration"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()
    const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || new URL(request.url).origin

    const result = await registerEmailUser({ email, password, name }, {
      findUserByEmail: (normalizedEmail) => prisma.user.findUnique({
        where: { email: normalizedEmail }
      }),
      createUser: (data) => (prisma.user.create as any)({
        data
      }),
      deleteUserByEmail: async (normalizedEmail) => {
        await (prisma.user.deleteMany as any)({
          where: { email: normalizedEmail, emailVerified: null }
        })
      },
      hashPassword: (plainPassword) => bcrypt.hash(plainPassword, 10),
      createToken: () => crypto.randomBytes(32).toString("hex"),
      sendVerificationEmail: sendVerificationEmailViaResend,
      now: () => new Date(),
      appUrl,
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    return NextResponse.json({
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      message: "注册成功，请前往邮箱完成验证"
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error && error.message === "Email service is not configured" ? "邮箱服务未配置" : "注册失败，请稍后重试" },
      { status: 500 }
    )
  }
}
