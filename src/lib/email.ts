interface VerificationEmailPayload {
  to: string;
  name: string;
  verificationUrl: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendVerificationEmailViaResend({
  to,
  name,
  verificationUrl,
}: VerificationEmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("Email service is not configured");
  }

  const displayName = escapeHtml(name || to);
  const safeVerificationUrl = escapeHtml(verificationUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "验证你的邮箱",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.7; color: #222;">
          <h2 style="margin: 0 0 16px;">欢迎使用微信公众号排版工具</h2>
          <p>${displayName}，请点击下面的按钮完成邮箱验证：</p>
          <p style="margin: 24px 0;">
            <a href="${safeVerificationUrl}" style="display: inline-block; padding: 10px 18px; background: #1a73e8; color: #fff; text-decoration: none; border-radius: 6px;">验证邮箱</a>
          </p>
          <p style="font-size: 13px; color: #666;">如果按钮无法打开，请复制这个链接到浏览器：<br>${safeVerificationUrl}</p>
          <p style="font-size: 13px; color: #999;">链接 24 小时内有效。如果不是你本人操作，可以忽略这封邮件。</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Email service failed: ${response.status} ${detail}`);
  }
}
