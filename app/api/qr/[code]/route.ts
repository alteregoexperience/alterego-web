export const runtime = "nodejs";

import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const buffer = await QRCode.toBuffer(code);
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": uint8.length.toString(),
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
