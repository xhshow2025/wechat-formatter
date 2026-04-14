import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// 获取单个文章
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const article = await prisma.article.findUnique({
    where: { id, userId: session.user.id }
  })

  if (!article) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 })
  }

  return NextResponse.json(article)
}

// 更新文章
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { title, content, blocks, template } = await request.json()

  const article = await prisma.article.updateMany({
    where: { id, userId: session.user.id },
    data: {
      title,
      content,
      blocks: blocks ? JSON.stringify(blocks) : undefined,
      template
    }
  })

  if (article.count === 0) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

// 删除文章
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  await prisma.article.deleteMany({
    where: { id, userId: session.user.id }
  })

  return NextResponse.json({ success: true })
}
