/**
 * ASTRION Phase 1: Legacy Memory Data Migration Script
 * Idempotently migrates .mentormaze-memories.json into SQL table (student_memory)
 * Retains original JSON file intact.
 */

import fs from "fs";
import path from "path";
import { getDb } from "../lib/db";
import { studentMemory } from "../lib/db/ai-mentor-schema";
import { eq } from "drizzle-orm";

export interface MemoryMigrationSummary {
  totalUsersInJson: number;
  totalMemoriesInJson: number;
  memoriesImported: number;
  memoriesSkipped: number;
  memoriesFailed: number;
  duplicateMemories: number;
  categoriesMigrated: Record<string, number>;
}

export async function migrateLegacyMemories(): Promise<MemoryMigrationSummary> {
  const jsonPath = path.resolve(process.cwd(), ".mentormaze-memories.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Legacy memory file not found at ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);
  const db = getDb();

  const summary: MemoryMigrationSummary = {
    totalUsersInJson: Object.keys(data).length,
    totalMemoriesInJson: 0,
    memoriesImported: 0,
    memoriesSkipped: 0,
    memoriesFailed: 0,
    duplicateMemories: 0,
    categoriesMigrated: {},
  };

  for (const [userId, items] of Object.entries<any[]>(data)) {
    if (!Array.isArray(items)) continue;
    summary.totalMemoriesInJson += items.length;

    for (const m of items) {
      try {
        if (!m.id || !m.category || !m.key || !m.value) {
          summary.memoriesSkipped++;
          continue;
        }

        const existing = await db
          .select({ id: studentMemory.id })
          .from(studentMemory)
          .where(eq(studentMemory.id, m.id))
          .limit(1);

        if (existing.length > 0) {
          // Idempotent update
          await db
            .update(studentMemory)
            .set({
              value: m.value,
              confidence: m.confidence ?? 1.0,
              provenance: m.provenance || "student_reported",
              isTemporary: !!m.isTemporary,
              expiresAt: m.expiresAt ? new Date(m.expiresAt) : null,
              updatedAt: m.lastUpdated || m.updatedAt ? new Date(m.lastUpdated || m.updatedAt) : new Date(),
            })
            .where(eq(studentMemory.id, m.id));
          summary.duplicateMemories++;
          summary.memoriesSkipped++;
        } else {
          await db.insert(studentMemory).values({
            id: m.id,
            studentUserId: m.studentUserId || userId,
            category: m.category,
            key: m.key,
            value: m.value,
            confidence: m.confidence ?? 1.0,
            provenance: m.provenance || "student_reported",
            isTemporary: !!m.isTemporary,
            expiresAt: m.expiresAt ? new Date(m.expiresAt) : null,
            createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
            updatedAt: m.lastUpdated || m.updatedAt ? new Date(m.lastUpdated || m.updatedAt) : new Date(),
          });
          summary.memoriesImported++;
        }

        summary.categoriesMigrated[m.category] = (summary.categoriesMigrated[m.category] || 0) + 1;
      } catch (err) {
        console.error(`Failed to migrate memory item ${m.id}:`, err);
        summary.memoriesFailed++;
      }
    }
  }

  return summary;
}

if (require.main === module) {
  migrateLegacyMemories()
    .then((s) => {
      console.log("Memory migration finished with summary:", s);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Memory migration failed:", err);
      process.exit(1);
    });
}
