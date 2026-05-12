import { NextResponse } from "next/server";
import COS from "cos-nodejs-sdk-v5";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function getCosConfig() {
  const SecretId = process.env.TENCENT_SECRET_ID;
  const SecretKey = process.env.TENCENT_SECRET_KEY;
  const Bucket = process.env.TENCENT_BUCKET;
  const Region = process.env.TENCENT_REGION;

  if (!SecretId || !SecretKey || !Bucket || !Region) {
    return null;
  }

  return { SecretId, SecretKey, Bucket, Region };
}

function sanitizeCosError(error: unknown) {
  const cosError = error as {
    code?: string;
    message?: string;
    statusCode?: number;
    requestId?: string;
  };

  return {
    code: cosError.code || "COS_UPLOAD_ERROR",
    message: cosError.message || "COS upload failed",
    statusCode: cosError.statusCode,
    requestId: cosError.requestId,
  };
}

function getPublicCosUrl(bucket: string, region: string, key: string) {
  const encodedKey = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `https://${bucket}.cos.${region}.myqcloud.com/${encodedKey}`;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const config = getCosConfig();
    if (!config) {
      return NextResponse.json(
        { error: "COS configuration is incomplete" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Image size must be less than 8MB" }, { status: 400 });
    }

    const cos = new COS({
      SecretId: config.SecretId,
      SecretKey: config.SecretKey,
    });

    // 将 File 转换为 Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 生成唯一的文件名，保持原始后缀
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const filename = `wechat-formatter/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    return new Promise<Response>((resolve) => {
      cos.putObject(
        {
          Bucket: config.Bucket,
          Region: config.Region,
          Key: filename,
          Body: buffer,
          ContentType: file.type,
        },
        (err) => {
          if (err) {
            const details = sanitizeCosError(err);
            console.error("COS Upload Error:", details);
            resolve(NextResponse.json({ error: "Upload failed", details }, { status: 500 }));
          } else {
            const url = getPublicCosUrl(config.Bucket, config.Region, filename);
            resolve(NextResponse.json({ url }));
          }
        }
      );
    });
  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: "Upload processing failed" }, { status: 500 });
  }
}
