import { describe, it, expect } from "vitest";
import { MatchmakingEngine, STRATEGY_PRESETS } from "../lib/matching/engine";
import { MATCH_DIMENSIONS, HUNDRED_MATCH_FACTORS } from "../lib/matching/factors";
import { store } from "../lib/data/store";

describe("MentorMaze 100-Factor Matchmaking Intelligence Engine", () => {
  it("verifies the catalog contains exactly 100 unique factors across 7 dimensions", () => {
    expect(HUNDRED_MATCH_FACTORS.length).toBe(100);

    const dimensionKeys = Object.keys(MATCH_DIMENSIONS);
    expect(dimensionKeys.length).toBe(7);

    // Verify uniqueness of factor IDs and Codes
    const ids = new Set(HUNDRED_MATCH_FACTORS.map((f) => f.id));
    const codes = new Set(HUNDRED_MATCH_FACTORS.map((f) => f.code));
    expect(ids.size).toBe(100);
    expect(codes.size).toBe(100);

    // Verify all factors map to a valid dimension
    HUNDRED_MATCH_FACTORS.forEach((f) => {
      expect(dimensionKeys).toContain(f.dimension);
      expect(f.weight).toBeGreaterThan(0);
      expect(f.name.length).toBeGreaterThan(3);
      expect(f.description.length).toBeGreaterThan(10);
    });
  });

  it("calculates comprehensive 100-factor scores with dimensional breakdowns in < 10ms", () => {
    const student = store.getStudentProfile("user-student-1");
    const approvedMentors = store.getMentors(true);

    const t0 = performance.now();
    const rankings = MatchmakingEngine.rankMentors(
      student,
      {
        targetRole: "Software Engineer",
        targetCompanies: ["Microsoft", "Google"],
        primaryLanguages: ["TypeScript", "Python"],
        systemDesignFocus: "both",
        interviewTimeline: "next_week",
        maxBudgetInr: 500,
      },
      approvedMentors,
      "balanced"
    );
    const duration = performance.now() - t0;

    // Must be ultra-fast (sub-10ms)
    expect(duration).toBeLessThan(10);

    expect(rankings.length).toBe(approvedMentors.length);
    expect(rankings[0].isBestMatch).toBe(true);
    expect(rankings[0].rank).toBe(1);

    // Verify top mentor properties
    const best = rankings[0];
    expect(best.overallScore).toBeGreaterThanOrEqual(80);
    expect(best.positiveHighlights.length).toBeGreaterThanOrEqual(3);
    expect(best.actionablePreparationAdvice.length).toBeGreaterThanOrEqual(2);

    // Verify all 7 dimensions exist and have scores
    Object.keys(MATCH_DIMENSIONS).forEach((dimKey) => {
      const dim = best.dimensions[dimKey as keyof typeof MATCH_DIMENSIONS];
      expect(dim).toBeDefined();
      expect(dim.score).toBeGreaterThanOrEqual(50);
      expect(dim.score).toBeLessThanOrEqual(100);
      expect(dim.factors.length).toBeGreaterThan(0);
    });

    // Verify 100 factor results across the 7 dimensions
    const totalAssessedFactors = Object.values(best.dimensions).reduce(
      (sum, d) => sum + d.factors.length,
      0
    );
    expect(totalAssessedFactors).toBe(100);
  });

  it("dynamically adjusts mentor rankings according to strategy presets", () => {
    const student = store.getStudentProfile("user-student-1");
    const approvedMentors = store.getMentors(true);

    const techRankings = MatchmakingEngine.rankMentors(
      student,
      {},
      approvedMentors,
      "technical_mastery"
    );
    expect(techRankings.length).toBeGreaterThan(0);
    expect(techRankings[0].dimensions.technical_skills.weight).toBeCloseTo(0.40, 2);

    const budgetRankings = MatchmakingEngine.rankMentors(
      student,
      { maxBudgetInr: 250 },
      approvedMentors,
      "budget_optimizer"
    );
    expect(budgetRankings[0].dimensions.economic_value.weight).toBeCloseTo(0.25, 2);
  });
});
