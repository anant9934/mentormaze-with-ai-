/**
 * MentorMaze On-Demand Translation API with Technical Glossary
 * Adapted from Cicada (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { NextRequest, NextResponse } from "next/server";
import { TranslationAdapter } from "@/lib/meeting-intelligence/translation-adapter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, srcLang = "en", dstLang = "hi" } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
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
