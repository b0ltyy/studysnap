import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
}
