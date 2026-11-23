/**
 * ASTRION Phase 1: Legacy Conversation Data Migration Script
 * Idempotently migrates .mentormaze-conversations.json into SQL tables (ai_mentor_conversations, ai_mentor_messages)
 * Retains original JSON file intact.
 */

import fs from "fs";
import path from "path";
import { getDb } from "../lib/db";
import { aiMentorConversations, aiMentorMessages } from "../lib/db/ai-mentor-schema";
import { eq } from "drizzle-orm";

export interface MigrationSummary {
  totalConversationsInJson: number;
  totalMessagesInJson: number;
  conversationsImported: number;
  conversationsSkipped: number;
  conversationsFailed: number;
  messagesImported: number;
  messagesSkipped: number;
  messagesFailed: number;
  duplicateConversations: number;
  duplicateMessages: number;
}

export async function migrateLegacyConversations(): Promise<MigrationSummary> {
  const jsonPath = path.resolve(process.cwd(), ".mentormaze-conversations.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Legacy conversation file not found at ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);
  const db = getDb();

  const summary: MigrationSummary = {
    totalConversationsInJson: 0,
    totalMessagesInJson: 0,
    conversationsImported: 0,
    conversationsSkipped: 0,
    conversationsFailed: 0,
    messagesImported: 0,
    messagesSkipped: 0,
    messagesFailed: 0,
    duplicateConversations: 0,
    duplicateMessages: 0,
  };

  const conversationsMap = data.conversations || {};
  const messagesMap = data.messages || {};

  summary.totalConversationsInJson = Object.keys(conversationsMap).length;

  // 1. Migrate Conversations
  for (const [id, c] of Object.entries<any>(conversationsMap)) {
    try {
      if (!c.id || !c.studentUserId) {
        summary.conversationsSkipped++;
        continue;
      }

      // Check if conversation already exists in SQL
      const existing = await db
        .select({ id: aiMentorConversations.id })
        .from(aiMentorConversations)
        .where(eq(aiMentorConversations.id, c.id))
        .limit(1);

      if (existing.length > 0) {
        // Idempotent update
        await db
          .update(aiMentorConversations)
          .set({
            title: c.title || "Untitled Session",
            mode: c.mode || "learn",
            activeTopic: c.activeTopic || "general",
            languagePreference: c.languagePreference || "en",
            updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
          })
          .where(eq(aiMentorConversations.id, c.id));
        summary.duplicateConversations++;
        summary.conversationsSkipped++;
      } else {
        await db.insert(aiMentorConversations).values({
          id: c.id,
          studentUserId: c.studentUserId,
          title: c.title || "Untitled Session",
          mode: c.mode || "learn",
          activeTopic: c.activeTopic || "general",
          languagePreference: c.languagePreference || "en",
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        });
        summary.conversationsImported++;
      }
    } catch (err) {
      console.error(`Failed to migrate conversation ${id}:`, err);
      summary.conversationsFailed++;
    }
  }

  // 2. Migrate Messages
  for (const [convId, msgList] of Object.entries<any[]>(messagesMap)) {
    if (!Array.isArray(msgList)) continue;
    summary.totalMessagesInJson += msgList.length;

    for (const m of msgList) {
      try {
        if (!m.id || !m.content || !m.role) {
          summary.messagesSkipped++;
          continue;
        }

        const existingMsg = await db
          .select({ id: aiMentorMessages.id })
          .from(aiMentorMessages)
          .where(eq(aiMentorMessages.id, m.id))
          .limit(1);

        if (existingMsg.length > 0) {
          summary.duplicateMessages++;
          summary.messagesSkipped++;
        } else {
          await db.insert(aiMentorMessages).values({
            id: m.id,
            conversationId: convId,
            role: m.role,
            content: m.content,
            teachingStrategy: m.teachingStrategy || null,
            hintLevel: m.hintLevel ?? 0,
            difficulty: m.difficulty || "intermediate",
            studentUnderstandingSignal: m.studentUnderstandingSignal || null,
            sources: m.sources || (m.modelProvider ? [{ title: m.modelProvider, urlOrId: m.inferenceMode || "default" }] : []),
            recommendedActions: m.recommendedActions || [],
            latencyMs: m.latencyMs ?? 0,
            createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
          });
          summary.messagesImported++;
        }
      } catch (err) {
        console.error(`Failed to migrate message ${m.id}:`, err);
        summary.messagesFailed++;
      }
    }
  }

  return summary;
}

if (require.main === module) {
  migrateLegacyConversations()
    .then((s) => {
      console.log("Migration finished with summary:", s);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
