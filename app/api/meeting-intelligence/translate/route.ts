/**
 * MentorMaze On-Demand Translation API with Technical Glossary
 * Adapted from Cicada (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Implements:
 * 1. Server-side feature gate (503 when disabled).
 * 2. Mandatory user authentication (401 when anonymous).
 * 3. Sliding window rate-limiting per user to protect cloud spend.
 */

import { NextRequest, NextResponse } from "next/server";
import { TranslationAdapter, authorizeTranslation } from "@/lib/meeting-intelligence";

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeTranslation(req);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const body = await req.json();
    const { text, srcLang = "en", dstLang = "hi" } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required and must be a string." }, { status: 400 });
    }

    const adapter = new TranslationAdapter();
    const translated = await adapter.translate(text, srcLang, dstLang);

    return NextResponse.json({
      success: true,
      original: text,
      srcLang,
      translated,
      dstLang,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
