"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Article {
  id: string
  title: string
  content: string
  template: string
  createdAt: string
  updatedAt: string
}

export default function ArticlesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchArticles()
    }
  }, [session])

  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/articles")
      if (res.ok) {
        const data = await res.json()
        setArticles(data)
      }
    } catch (error) {
      console.error("获取文章失败", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这篇文章吗？")) return

    try {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" })
      if (res.ok) {
        setArticles(articles.filter(a => a.id !== id))
      }
    } catch (error) {
      console.error("删除失败", error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        加载中...
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* 头部导航 */}
      <header style={{
        background: "white",
        padding: "16px 24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "#333",
            textDecoration: "none"
          }}>
            微信公众号排版工具
          </Link>
          <span style={{ color: "#1a73e8" }}>我的文章库</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "#666" }}>{session?.user?.email}</span>
          <Link href="/" style={{
            padding: "8px 16px",
            background: "#f5f5f5",
            borderRadius: "6px",
            color: "#333",
            textDecoration: "none",
            fontSize: "14px"
          }}>
            去排版
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              padding: "8px 16px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            退出登录
          </button>
        </div>
      </header>

      {/* 内容区 */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px"
        }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>我的文章</h1>
          <Link href="/" style={{
            padding: "12px 24px",
            background: "#1a73e8",
            color: "white",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "14px"
          }}>
            新建文章
          </Link>
        </div>

        {articles.length === 0 ? (
          <div style={{
            background: "white",
            padding: "60px",
            borderRadius: "12px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
            <div style={{ color: "#666", marginBottom: "16px" }}>还没有文章</div>
            <Link href="/" style={{
              padding: "12px 24px",
              background: "#1a73e8",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px"
            }}>
              开始排版
            </Link>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px"
          }}>
            {articles.map((article) => (
              <div
                key={article.id}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  transition: "box-shadow 0.2s"
                }}
              >
                <div style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {article.title || "未命名文章"}
                </div>
                <div style={{
                  fontSize: "13px",
                  color: "#999",
                  marginBottom: "12px"
                }}>
                  {formatDate(article.updatedAt)}
                </div>
                <div style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "16px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {article.content?.slice(0, 100) || "无内容"}
                </div>
                <div style={{
                  display: "flex",
                  gap: "8px"
                }}>
                  <Link
                    href={`/?articleId=${article.id}`}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "#1a73e8",
                      color: "white",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontSize: "13px",
                      textAlign: "center"
                    }}
                  >
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(article.id)}
                    style={{
                      padding: "8px 12px",
                      background: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px"
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
