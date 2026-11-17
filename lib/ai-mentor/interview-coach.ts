/**
 * Adaptive Technical & Behavioral Interview Coach
 * Role-Based Rubrics, STAR Evaluation, and Progressive Questioning
 * Brand: MentorMaze by AI Tathastu
 */

export interface InterviewRubricEvaluation {
  overallScore: number; // 0.0 to 10.0
  technicalCorrectness: number;
  problemSolvingDepth: number;
  complexityJustification: number;
  edgeCaseAwareness: number;
  communicationClarity: number;
  starCompliance?: {
    situationPresent: boolean;
    taskClear: boolean;
    actionEmphasized: boolean;
    resultQuantified: boolean;
  };
  constructiveFeedback: string;
  recommendedNextQuestion: string;
  isAiPracticeDisclaimer: string;
}

export interface InterviewQuestionItem {
  id: string;
  category: "dsa" | "system_design" | "behavioral" | "backend" | "frontend";
  roleLevel: "SDE-1" | "SDE-2" | "Intern";
  questionText: string;
  expectedKeyPoints: string[];
  followUpProbes: string[];
}

export class InterviewCoachService {
  private static questionBank: InterviewQuestionItem[] = [
    {
      id: "int-q1-two-sum",
      category: "dsa",
      roleLevel: "SDE-1",
      questionText: "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`. What is your initial approach, and what are the time and space trade-offs?",
      expectedKeyPoints: [
        "Mention naive O(N²) nested loop brute-force first",
        "Optimize using Hash Map complement lookup in O(N) time and O(N) space",
        "Address edge case where the exact same element cannot be used twice",
      ],
      followUpProbes: [
        "What if the input array is already sorted? Can we solve it in O(1) space?",
        "What happens if memory is strictly constrained and we cannot allocate a Hash Map?",
      ],
    },
    {
      id: "int-q2-lru-cache",
      category: "dsa",
      roleLevel: "SDE-1",
      questionText: "How would you design a data structure that implements a Least Recently Used (LRU) Cache supporting `get` and `put` operations in O(1) time?",
      expectedKeyPoints: [
        "Combination of Hash Map for O(1) key lookup and Doubly Linked List for O(1) node removal and head insertion",
        "Explain dummy head and tail sentinel nodes to eliminate null checks",
        "Evict node before tail when capacity is exceeded",
      ],
      followUpProbes: [
        "How would you make this LRU Cache thread-safe for concurrent read/write access?",
      ],
    },
    {
      id: "int-q3-star-disagreement",
      category: "behavioral",
      roleLevel: "SDE-1",
      questionText: "Tell me about a time you had a technical disagreement with a teammate or project partner. How did you resolve it?",
      expectedKeyPoints: [
        "Clearly defined Situation and Task without badmouthing the teammate",
        "Demonstrated Action through objective benchmarking or prototype comparison rather than ego",
        "Result showing project success, mutual respect, and lessons learned",
      ],
      followUpProbes: [
        "If the data had been inconclusive, how would you have decided who broke the tie?",
      ],
    },
  ];

  /**
   * Retrieves an adaptive interview question for the student's selected track & difficulty
   */
  public static getNextQuestion(
    category: InterviewQuestionItem["category"] = "dsa",
    roleLevel: InterviewQuestionItem["roleLevel"] = "SDE-1"
  ): InterviewQuestionItem {
    const match = this.questionBank.find((q) => q.category === category && q.roleLevel === roleLevel);
    return match || this.questionBank[0];
  }

  /**
   * Evaluates a student's technical or behavioral interview response against FAANG rubric dimensions
   */
  public static evaluateAnswer(
    questionId: string,
    studentAnswer: string
  ): InterviewRubricEvaluation {
    const lower = studentAnswer.toLowerCase();
    const length = studentAnswer.trim().split(/\s+/).length;

    // Detect algorithmic keywords
    const mentionsComplexity = lower.includes("o(n)") || lower.includes("o(1)") || lower.includes("time complexity");
    const mentionsEdgeCases = lower.includes("empty") || lower.includes("null") || lower.includes("edge case") || lower.includes("duplicate");
    const mentionsDataStructure = lower.includes("hash map") || lower.includes("set") || lower.includes("two pointers") || lower.includes("map");

    // Compute scores
    const technicalCorrectness = mentionsDataStructure ? 8.5 : 7.0;
    const problemSolvingDepth = length > 30 ? 8.2 : 6.5;
    const complexityJustification = mentionsComplexity ? 9.0 : 5.5;
    const edgeCaseAwareness = mentionsEdgeCases ? 8.5 : 6.0;
    const communicationClarity = length > 25 ? 8.5 : 7.0;

    const overallScore = Number(
      ((technicalCorrectness + problemSolvingDepth + complexityJustification + edgeCaseAwareness + communicationClarity) / 5).toFixed(1)
    );

    // STAR check
    const starCompliance = {
      situationPresent: lower.includes("when") || lower.includes("project") || lower.includes("situation"),
      taskClear: lower.includes("goal") || lower.includes("task") || lower.includes("need"),
      actionEmphasized: lower.includes("i implemented") || lower.includes("i built") || lower.includes("i decided") || lower.includes("i benchmarked"),
      resultQuantified: lower.includes("%") || lower.includes("reduced") || lower.includes("improved") || lower.includes("result"),
    };

    let feedback = `**Overall Performance Score: ${overallScore}/10**\n\n`;
    if (!mentionsComplexity) {
      feedback += "⚠️ **Complexity Omission**: Always state your Worst-Case and Best-Case asymptotic time and space bounds before coding.\n";
    }
    if (!mentionsEdgeCases) {
      feedback += "💡 **Edge Case Awareness**: Call out empty array, null pointer, and single-element bounds up-front to demonstrate senior engineering rigor.\n";
    }
    if (mentionsComplexity && mentionsEdgeCases) {
      feedback += "✅ **Excellent Technical Articulation**: You identified the optimal data structure and justified time/space bounds cleanly.\n";
    }

    return {
      overallScore,
      technicalCorrectness,
      problemSolvingDepth,
      complexityJustification,
      edgeCaseAwareness,
      communicationClarity,
      starCompliance,
      constructiveFeedback: feedback,
      recommendedNextQuestion: "Would you like to trace this with a concrete example or explore the concurrency follow-up?",
      isAiPracticeDisclaimer: "Notice: This evaluation is an AI-generated pedagogical simulation for interview preparation and does not represent an actual hiring decision by an employer.",
    };
  }
}
