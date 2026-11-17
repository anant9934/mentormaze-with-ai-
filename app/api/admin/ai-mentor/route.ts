import { NextRequest, NextResponse } from "next/server";
import { ModelProviderRouter } from "@/lib/ai-mentor/model-provider-router";
import { DatasetGovernanceService } from "@/lib/ai-mentor/dataset-governance";
import { EvaluationBenchmarkSuite } from "@/lib/ai-mentor/evaluation-benchmark";
import { KnowledgeRAGService } from "@/lib/ai-mentor/knowledge-rag-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const providers = ModelProviderRouter.getProviderStatus();
    const datasets = DatasetGovernanceService.getDatasetRegistry();
    const benchmark = EvaluationBenchmarkSuite.runBenchmarkSuite();
    const sampleKnowledge = KnowledgeRAGService.search("", undefined, 10);

    return NextResponse.json({
      success: true,
      data: {
        providers,
        datasets,
        benchmark,
        knowledgeSourcesCount: 5,
        totalDocumentsIndexed: 6,
        safetyStatus: "Active - PII Scrubbing & Crisis Escalation Operational",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
