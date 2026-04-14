import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const articles = await prisma.article.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      template: true,
      createdAt: true,
      updatedAt: true
    }
  })

  return NextResponse.json(articles)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { title, content, blocks, template } = await request.json()

  const article = await prisma.article.create({
    data: {
      title: title || "未命名文章",
      content: content || "",
      blocks: blocks ? JSON.stringify(blocks) : "[]",
      template: template || "simple-white",
      userId: session.user.id
    }
  })

  return NextResponse.json(article)
}
