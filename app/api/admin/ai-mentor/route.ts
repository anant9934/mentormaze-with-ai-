import { NextRequest, NextResponse } from "next/server";
import { ModelProviderRouter } from "@/lib/ai-mentor/model-provider-router";
import { DatasetGovernanceService } from "@/lib/ai-mentor/dataset-governance";
import { EvaluationBenchmarkSuite } from "@/lib/ai-mentor/evaluation-benchmark";
import { KnowledgeRAGService } from "@/lib/ai-mentor/knowledge-rag-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const providers = ModelProviderRouter.getProviderStatus();
    const telemetry = ModelProviderRouter.getTelemetryAnalytics();
    const datasets = DatasetGovernanceService.getDatasetRegistry();
    const benchmark = EvaluationBenchmarkSuite.runBenchmarkSuite();
    const ragStats = KnowledgeRAGService.getStats();

    return NextResponse.json({
      success: true,
      data: {
        providers,
        telemetry,
        datasets,
        benchmark,
        ragStats,
        knowledgeSourcesCount: 8,
        totalDocumentsIndexed: ragStats.totalDocuments,
        verifiedDocumentCount: ragStats.verifiedCount,
        safetyStatus: "Active - PII Scrubbing, Crisis Escalation & Data Isolation Operational",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
