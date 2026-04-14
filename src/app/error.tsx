"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif",
      background: "#f5f5f5"
    }}>
      <div style={{
        background: "white",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        textAlign: "center",
        maxWidth: "500px"
      }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
        <h2 style={{ fontSize: "20px", marginBottom: "12px", color: "#333" }}>出错了</h2>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
          {error.message || "发生了未知错误"}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "10px 24px",
            background: "#1a73e8",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          重试
        </button>
      </div>
    </div>
  )
}
