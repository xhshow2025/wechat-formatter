import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")
  const loginUrl = new URL("/login", url.origin)

  if (!token) {
    loginUrl.searchParams.set("verified", "invalid")
    return NextResponse.redirect(loginUrl)
  }

  const user = await prisma.user.findFirst({
    where: { verificationToken: token }
  }) as any

  if (!user) {
    loginUrl.searchParams.set("verified", "invalid")
    return NextResponse.redirect(loginUrl)
  }

  if (!user.verificationExpires || user.verificationExpires < new Date()) {
    loginUrl.searchParams.set("verified", "expired")
    return NextResponse.redirect(loginUrl)
  }

  await (prisma.user.update as any)({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
      verificationExpires: null
    }
  })

  loginUrl.searchParams.set("verified", "success")
  return NextResponse.redirect(loginUrl)
}
