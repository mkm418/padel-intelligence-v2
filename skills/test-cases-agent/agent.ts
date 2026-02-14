/**
 * agent.ts — Core test cases agent
 *
 * Orchestrates the full test generation pipeline:
 *   Phase 1: ANALYZE — read source, extract branch map
 *   Phase 2: PLAN — prioritize test cases by risk
 *   Phase 3: GENERATE — produce executable test code (Ralph Loop)
 *   Phase 4: VERIFY — grade quality, check coverage
 *   Phase 5: REPORT — output final structured report
 *
 * 2026 Best Practices Applied:
 * - Ralph Loop: iterative generation with fresh context per task
 * - Agent-Pex: specification extraction from source code
 * - TestForge: iterative refinement beats single-shot
 * - ToolFuzz: adversarial persona-driven test generation
 * - BenchAgents: decomposed multi-phase pipeline
 * - StructTest: deterministic schema validation at every phase
 * - Chain-of-Symbol: symbolic branch mapping over verbose reasoning
 */

import {
  SYSTEM_PROMPT,
  ANALYZE_PROMPT,
  PLAN_PROMPT,
  GENERATE_CODE_PROMPT,
  VERIFY_PROMPT,
  FEW_SHOT_EXAMPLES,
  fillPrompt,
} from "./prompts";

import {
  type TestCase,
  type TestPlan,
  type AnalysisResult,
  type TestReport,
  type VerificationReport,
  validateTestCase,
  validateTestPlan,
} from "./schemas";

import {
  gradeTestPlan,
  checkBranchCoverage,
  checkPersonaDiversity,
} from "./graders";

// ─── Configuration ──────────────────────────────────────────────────────────

export interface AgentConfig {
  /** Target code coverage percentage (default: 80) */
  coverageTarget: number;
  /** Test framework: "jest" | "vitest" | "pytest" | "go-test" (default: "vitest") */
  testFramework: string;
  /** Language: "typescript" | "python" | "go" | "rust" (default: "typescript") */
  language: string;
  /** Max Ralph Loop iterations before stopping (default: 5) */
  maxIterations: number;
  /** Minimum quality score for a test to pass (default: 10/15) */
  qualityThreshold: number;
  /** Enable adversarial/fuzz test generation (default: true) */
  adversarialMode: boolean;
  /** Output directory for generated files */
  outputDir: string;
}

const DEFAULT_CONFIG: AgentConfig = {
  coverageTarget: 80,
  testFramework: "vitest",
  language: "typescript",
  maxIterations: 5,
  qualityThreshold: 10,
  adversarialMode: true,
  outputDir: "output/test-cases",
};

// ─── Agent State ────────────────────────────────────────────────────────────

interface AgentState {
  config: AgentConfig;
  analysis: AnalysisResult | null;
  plan: TestPlan | null;
  verification: VerificationReport | null;
  generatedFiles: Array<{ path: string; content: string }>;
  iteration: number;
  errors: string[];
  startTime: number;
}

// ─── Core Agent Class ───────────────────────────────────────────────────────

export class TestCasesAgent {
  private state: AgentState;

  constructor(config: Partial<AgentConfig> = {}) {
    this.state = {
      config: { ...DEFAULT_CONFIG, ...config },
      analysis: null,
      plan: null,
      verification: null,
      generatedFiles: [],
      iteration: 0,
      errors: [],
      startTime: Date.now(),
    };
  }

  // ── Phase 1: Analyze ───────────────────────────────────────────────────

  /**
   * Analyze source code and produce a Chain-of-Symbol branch map.
   *
   * This is the Agent-Pex-inspired phase: extract testable rules
   * directly from the code's structure, types, and contracts.
   */
  buildAnalyzePrompt(sourceCode: string, filePath: string): string {
    return [
      SYSTEM_PROMPT,
      "\n---\n",
      fillPrompt(ANALYZE_PROMPT, { SOURCE_CODE: sourceCode }),
    ].join("\n");
  }

  /**
   * Parse and validate the analysis result from the LLM.
   * Returns the validated AnalysisResult or throws with specific errors.
   */
  parseAnalysis(llmOutput: string): AnalysisResult {
    const json = this.extractJSON(llmOutput);
    const analysis = JSON.parse(json) as AnalysisResult;

    // Validate structure
    if (!analysis.file) throw new Error("Analysis missing 'file' field");
    if (!Array.isArray(analysis.functions)) throw new Error("Analysis missing 'functions' array");
    if (!analysis.summary) throw new Error("Analysis missing 'summary' field");

    // Validate each function has a branch map
    for (const fn of analysis.functions) {
      if (!fn.branchMap || fn.branchMap.trim().length === 0) {
        throw new Error(`Function '${fn.name}' has empty branch map`);
      }
      if (fn.riskScore < 1 || fn.riskScore > 10) {
        throw new Error(`Function '${fn.name}' has invalid riskScore: ${fn.riskScore}`);
      }
    }

    this.state.analysis = analysis;
    return analysis;
  }

  // ── Phase 2: Plan ──────────────────────────────────────────────────────

  /**
   * Generate a test plan based on the analysis.
   * Prioritizes by risk: 🔒 > ◆ > ✗ > ⚠ > ✓
   */
  buildPlanPrompt(analysis: AnalysisResult): string {
    return [
      SYSTEM_PROMPT,
      "\n---\n",
      fillPrompt(PLAN_PROMPT, {
        ANALYSIS_JSON: JSON.stringify(analysis, null, 2),
        FEW_SHOT_JSON: JSON.stringify(FEW_SHOT_EXAMPLES, null, 2),
        COVERAGE_TARGET: String(this.state.config.coverageTarget),
      }),
    ].join("\n");
  }

  /**
   * Parse and validate the test plan from the LLM.
   * Uses StructTest-style deterministic validation.
   */
  parsePlan(llmOutput: string): TestPlan {
    const json = this.extractJSON(llmOutput);
    const plan = JSON.parse(json) as TestPlan;

    // Run schema validation
    const validation = validateTestPlan(plan);
    if (!validation.valid) {
      throw new Error(`Test plan validation failed:\n${validation.errors.join("\n")}`);
    }

    this.state.plan = plan;
    return plan;
  }

  // ── Phase 3: Generate (Ralph Loop) ─────────────────────────────────────

  /**
   * Build prompt for generating executable test code for a single test case.
   * Each iteration of the Ralph Loop calls this for one test case.
   */
  buildGeneratePrompt(testCase: TestCase): string {
    return [
      SYSTEM_PROMPT,
      "\n---\n",
      fillPrompt(GENERATE_CODE_PROMPT, {
        TEST_CASE_JSON: JSON.stringify(testCase, null, 2),
        TEST_FRAMEWORK: this.state.config.testFramework,
        LANGUAGE: this.state.config.language,
      }),
    ].join("\n");
  }

  /**
   * Ralph Loop: iterate through test cases, generating code for each.
   *
   * Pattern:
   * 1. Pick next ungenerated test case
   * 2. Generate test code
   * 3. Validate output (syntax, schema compliance)
   * 4. If fail → diagnose, retry (max 3 attempts per test)
   * 5. If pass → save, move to next
   * 6. Repeat until all tests generated or max iterations hit
   *
   * Returns the list of generated test case IDs.
   */
  getRalphLoopStatus(): {
    completed: string[];
    remaining: string[];
    iteration: number;
    maxIterations: number;
    shouldContinue: boolean;
  } {
    if (!this.state.plan) throw new Error("No test plan — run Phase 2 first");

    const completedIds = this.state.generatedFiles.map((f) =>
      f.path.replace(/\.(test|spec)\.(ts|js|py|go)$/, "")
    );

    const remaining = this.state.plan.testCases
      .map((tc) => tc.id)
      .filter((id) => !completedIds.includes(id));

    return {
      completed: completedIds,
      remaining,
      iteration: this.state.iteration,
      maxIterations: this.state.config.maxIterations,
      shouldContinue: remaining.length > 0 && this.state.iteration < this.state.config.maxIterations,
    };
  }

  /**
   * Record a generated test file.
   * Called after each successful Ralph Loop iteration.
   */
  recordGeneratedFile(testCaseId: string, content: string): void {
    const ext = this.getFileExtension();
    const path = `${this.state.config.outputDir}/${testCaseId}.test.${ext}`;
    this.state.generatedFiles.push({ path, content });
    this.state.iteration++;
  }

  // ── Phase 4: Verify ────────────────────────────────────────────────────

  /**
   * Build verification prompt for quality grading.
   */
  buildVerifyPrompt(testCases: TestCase[]): string {
    return [
      SYSTEM_PROMPT,
      "\n---\n",
      fillPrompt(VERIFY_PROMPT, {
        TEST_CASES_JSON: JSON.stringify(testCases, null, 2),
      }),
    ].join("\n");
  }

  /**
   * Run local (deterministic) grading on the test plan.
   * Uses graders.ts for rule-based evaluation — no LLM needed.
   */
  runLocalGrading(): VerificationReport {
    if (!this.state.plan) throw new Error("No test plan — run Phase 2 first");

    const report = gradeTestPlan(this.state.plan);
    this.state.verification = report;
    return report;
  }

  /**
   * Check branch coverage completeness.
   */
  checkCoverage(): {
    coveragePercent: number;
    uncoveredBranches: Array<{ function: string; symbol: string; line: string }>;
    personaGaps: string[];
  } {
    if (!this.state.analysis || !this.state.plan) {
      throw new Error("Run Phase 1 and Phase 2 first");
    }

    const branchCoverage = checkBranchCoverage(
      this.state.analysis,
      this.state.plan.testCases
    );

    const personaDiversity = checkPersonaDiversity(this.state.plan.testCases);

    return {
      coveragePercent: branchCoverage.coveragePercent,
      uncoveredBranches: branchCoverage.uncovered,
      personaGaps: personaDiversity.missing,
    };
  }

  // ── Phase 5: Report ────────────────────────────────────────────────────

  /**
   * Generate the final comprehensive test report.
   */
  buildReport(): TestReport {
    if (!this.state.analysis || !this.state.plan || !this.state.verification) {
      throw new Error("All phases must complete before generating report");
    }

    const branchCoverage = checkBranchCoverage(
      this.state.analysis,
      this.state.plan.testCases
    );
    const personaDiversity = checkPersonaDiversity(this.state.plan.testCases);

    return {
      reportId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      analysis: this.state.analysis,
      plan: this.state.plan,
      verification: this.state.verification,
      generatedCode: {
        framework: this.state.config.testFramework,
        language: this.state.config.language,
        files: this.state.generatedFiles,
      },
      metrics: {
        totalTestCases: this.state.plan.totalTestCases,
        passingGrade: this.state.verification.summary.passing,
        failingGrade: this.state.verification.summary.failing,
        averageQualityScore: this.state.verification.summary.averageScore,
        coverageEstimate: branchCoverage.coveragePercent,
        categoryCounts: this.state.plan.categories,
        personaCounts: personaDiversity.counts,
        branchCoverage: branchCoverage.covered,
      },
    };
  }

  // ── Utilities ──────────────────────────────────────────────────────────

  /** Extract JSON from LLM output (handles markdown code fences) */
  private extractJSON(output: string): string {
    // Try direct parse first
    try {
      JSON.parse(output);
      return output;
    } catch {
      // Extract from code fences
      const match = output.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (match) return match[1].trim();

      // Try finding first { to last }
      const start = output.indexOf("{");
      const end = output.lastIndexOf("}");
      if (start !== -1 && end !== -1) return output.slice(start, end + 1);

      throw new Error("Could not extract JSON from LLM output");
    }
  }

  /** Get file extension for the configured language */
  private getFileExtension(): string {
    const extMap: Record<string, string> = {
      typescript: "ts",
      python: "py",
      go: "go",
      rust: "rs",
      javascript: "js",
    };
    return extMap[this.state.config.language] || "ts";
  }

  /** Get current agent state (for debugging/logging) */
  getState(): Readonly<AgentState> {
    return { ...this.state };
  }

  /** Get elapsed time in seconds */
  getElapsedSeconds(): number {
    return Math.round((Date.now() - this.state.startTime) / 1000);
  }
}

// ─── Factory Function ───────────────────────────────────────────────────────

/**
 * Create a new test cases agent with the given configuration.
 *
 * Usage:
 * ```typescript
 * const agent = createTestCasesAgent({
 *   coverageTarget: 90,
 *   testFramework: "vitest",
 *   language: "typescript",
 *   adversarialMode: true,
 * });
 *
 * // Phase 1: Analyze
 * const analyzePrompt = agent.buildAnalyzePrompt(sourceCode, "src/api/auth.ts");
 * // Send to LLM, get response
 * const analysis = agent.parseAnalysis(llmResponse);
 *
 * // Phase 2: Plan
 * const planPrompt = agent.buildPlanPrompt(analysis);
 * // Send to LLM, get response
 * const plan = agent.parsePlan(llmResponse);
 *
 * // Phase 3: Generate (Ralph Loop)
 * while (agent.getRalphLoopStatus().shouldContinue) {
 *   const next = agent.getRalphLoopStatus().remaining[0];
 *   const tc = plan.testCases.find(t => t.id === next)!;
 *   const genPrompt = agent.buildGeneratePrompt(tc);
 *   // Send to LLM, get test code
 *   agent.recordGeneratedFile(tc.id, testCode);
 * }
 *
 * // Phase 4: Verify
 * const grades = agent.runLocalGrading();
 * const coverage = agent.checkCoverage();
 *
 * // Phase 5: Report
 * const report = agent.buildReport();
 * ```
 */
export function createTestCasesAgent(config: Partial<AgentConfig> = {}): TestCasesAgent {
  return new TestCasesAgent(config);
}
