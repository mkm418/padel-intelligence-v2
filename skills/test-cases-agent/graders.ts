/**
 * graders.ts — Automated grading functions for test case quality
 *
 * Incorporates 2026 best practices:
 * - StructTest-style deterministic rule-based evaluation
 * - Multi-dimensional rubric scoring (Agent-Pex style)
 * - Adversarial coverage checks
 * - Branch coverage completeness verification
 */

import type {
  TestCase,
  TestPlan,
  TestGrade,
  VerificationReport,
  AnalysisResult,
  BranchSymbol,
  TestCategory,
  TestPersona,
} from "./schemas";

// ─── Scoring Constants ──────────────────────────────────────────────────────

/** Minimum total score (out of 15) for a test to pass quality gate */
const PASS_THRESHOLD = 10;

/** Weights for computing overall plan quality */
const DIMENSION_WEIGHTS = {
  specificity: 1.0,
  uniqueness: 0.8,
  realism: 1.0,
  completeness: 0.9,
  adversarial: 0.7,
};

// ─── Individual Test Graders ────────────────────────────────────────────────

/** Score specificity: are assertions concrete and programmatic? */
function gradeSpecificity(tc: TestCase): number {
  let score = 0;

  // Check assertion quality
  const hasExpect = tc.assertions.some((a) => a.includes("expect(") || a.includes("assert"));
  if (hasExpect) score += 1;

  // Check for specific values (not just "truthy")
  const hasSpecificValues = tc.assertions.some(
    (a) => a.includes("toBe(") || a.includes("toEqual(") || a.includes("toContain(") || a.includes("== ")
  );
  if (hasSpecificValues) score += 1;

  // Check expected result is specific (not vague)
  const vaguePhrases = ["should work", "correct", "properly", "as expected", "no issues"];
  const isVague = vaguePhrases.some((v) => tc.expectedResult.toLowerCase().includes(v));
  if (!isVague) score += 1;

  return Math.min(score, 3);
}

/** Score uniqueness: does this test cover a unique branch? */
function gradeUniqueness(tc: TestCase, allTests: TestCase[]): number {
  let score = 0;

  // Check if this is the only test for this function + branch symbol combo
  const sameBranch = allTests.filter(
    (t) => t.targetFunction === tc.targetFunction && t.branchSymbol === tc.branchSymbol
  );
  if (sameBranch.length === 1) score += 2; // Unique branch coverage
  else if (sameBranch.length <= 2) score += 1; // Acceptable overlap

  // Check if tags are distinct from other tests on same function
  const otherTests = allTests.filter(
    (t) => t.targetFunction === tc.targetFunction && t.id !== tc.id
  );
  const otherTags = new Set(otherTests.flatMap((t) => t.tags));
  const uniqueTags = tc.tags.filter((t) => !otherTags.has(t));
  if (uniqueTags.length > 0) score += 1;

  return Math.min(score, 3);
}

/** Score realism: would this catch a real production bug? */
function gradeRealism(tc: TestCase): number {
  let score = 0;

  // Tests with preconditions show understanding of real-world state
  if (tc.preconditions.length > 0) score += 1;

  // Multi-step tests are more realistic than single-assertion
  if (tc.steps.length >= 2) score += 1;

  // I/O, security, and integration tests are inherently more realistic
  const realisticCategories: TestCategory[] = ["integration", "e2e", "security", "performance"];
  if (realisticCategories.includes(tc.category)) score += 1;

  // Adversarial personas (not happy path) catch real bugs
  const adversarialPersonas: TestPersona[] = ["Malicious Mallory", "Edge-Case Eddie", "Impatient Irene", "Scale-Up Sam"];
  if (adversarialPersonas.includes(tc.persona)) score += 1;

  return Math.min(score, 3);
}

/** Score completeness: are preconditions, steps, and cleanup all present? */
function gradeCompleteness(tc: TestCase): number {
  let score = 0;

  // Has preconditions defined
  if (tc.preconditions.length > 0) score += 1;

  // Has multiple steps (setup → action → verify)
  if (tc.steps.length >= 2) score += 1;

  // Has description AND expected result (documentation)
  if (tc.description.length > 20 && tc.expectedResult.length > 20) score += 1;

  return Math.min(score, 3);
}

/** Score adversarial thinking: does this test think like an attacker? */
function gradeAdversarial(tc: TestCase): number {
  let score = 0;

  // Non-happy-path tests get a point
  if (tc.branchSymbol !== "✓") score += 1;

  // Security-focused tests
  if (tc.category === "security" || tc.category === "fuzz") score += 1;

  // Tests from adversarial personas
  if (tc.persona === "Malicious Mallory") score += 1;

  // Tests that check error handling
  const errorKeywords = ["error", "throw", "reject", "fail", "invalid", "unauthorized", "forbidden"];
  const hasErrorCheck = tc.assertions.some((a) =>
    errorKeywords.some((k) => a.toLowerCase().includes(k))
  );
  if (hasErrorCheck) score += 1;

  return Math.min(score, 3);
}

// ─── Test Plan Graders ──────────────────────────────────────────────────────

/** Grade a single test case across all dimensions */
export function gradeTestCase(tc: TestCase, allTests: TestCase[]): TestGrade {
  const scores = {
    specificity: gradeSpecificity(tc),
    uniqueness: gradeUniqueness(tc, allTests),
    realism: gradeRealism(tc),
    completeness: gradeCompleteness(tc),
    adversarial: gradeAdversarial(tc),
  };

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const pass = totalScore >= PASS_THRESHOLD;

  // Generate actionable feedback for failing tests
  let feedback = "";
  if (!pass) {
    const weakest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0];
    const feedbackMap: Record<string, string> = {
      specificity: "Assertions are too vague. Use exact expect() calls with specific values.",
      uniqueness: "This test duplicates coverage from another test. Target a different branch.",
      realism: "Add preconditions and multi-step workflows to mirror real usage.",
      completeness: "Missing preconditions or insufficient step detail. Add setup/teardown.",
      adversarial: "Add error-path checks. Think like Malicious Mallory.",
    };
    feedback = feedbackMap[weakest[0]] || "Improve overall test quality.";
  }

  return { testId: tc.id, scores, totalScore, pass, feedback };
}

/** Grade an entire test plan and produce a verification report */
export function gradeTestPlan(plan: TestPlan): VerificationReport {
  const grades = plan.testCases.map((tc) => gradeTestCase(tc, plan.testCases));

  const passing = grades.filter((g) => g.pass).length;
  const failing = grades.filter((g) => !g.pass).length;
  const averageScore = grades.reduce((sum, g) => sum + g.totalScore, 0) / grades.length;

  // Find weakest dimension across all tests
  const dimensionTotals: Record<string, number> = {
    specificity: 0, uniqueness: 0, realism: 0, completeness: 0, adversarial: 0,
  };
  for (const grade of grades) {
    for (const [dim, score] of Object.entries(grade.scores)) {
      dimensionTotals[dim] += score;
    }
  }
  const weakestDimension = Object.entries(dimensionTotals).sort((a, b) => a[1] - b[1])[0][0];

  return {
    grades,
    summary: {
      totalTests: grades.length,
      passing,
      failing,
      averageScore: Math.round(averageScore * 10) / 10,
      weakestDimension,
    },
  };
}

// ─── Coverage Analysis ──────────────────────────────────────────────────────

/** Check which branch symbols from analysis are covered by test cases */
export function checkBranchCoverage(
  analysis: AnalysisResult,
  testCases: TestCase[]
): {
  covered: Record<BranchSymbol, number>;
  uncovered: Array<{ function: string; symbol: BranchSymbol; line: string }>;
  coveragePercent: number;
} {
  const allSymbols: BranchSymbol[] = ["✓", "✗", "⚠", "→", "↳", "◆", "🔒"];
  const covered: Record<BranchSymbol, number> = {} as Record<BranchSymbol, number>;
  for (const s of allSymbols) covered[s] = 0;

  // Count covered symbols
  for (const tc of testCases) {
    covered[tc.branchSymbol] = (covered[tc.branchSymbol] || 0) + 1;
  }

  // Find uncovered branches from analysis
  const uncovered: Array<{ function: string; symbol: BranchSymbol; line: string }> = [];

  for (const fn of analysis.functions) {
    const lines = fn.branchMap.split("\n").filter((l) => l.trim());
    for (const line of lines) {
      // Find which symbol this line starts with
      const symbol = allSymbols.find((s) => line.trim().startsWith(s));
      if (symbol) {
        // Check if any test covers this function + symbol
        const hasCoverage = testCases.some(
          (tc) => tc.targetFunction === fn.name && tc.branchSymbol === symbol
        );
        if (!hasCoverage) {
          uncovered.push({ function: fn.name, symbol, line: line.trim() });
        }
      }
    }
  }

  // Total branches from analysis vs covered
  const totalBranches = analysis.summary.totalBranches;
  const coveredBranches = totalBranches - uncovered.length;
  const coveragePercent = totalBranches > 0
    ? Math.round((coveredBranches / totalBranches) * 100)
    : 0;

  return { covered, uncovered, coveragePercent };
}

/** Check persona diversity — are all personas represented? */
export function checkPersonaDiversity(
  testCases: TestCase[]
): { counts: Record<TestPersona, number>; missing: TestPersona[] } {
  const allPersonas: TestPersona[] = [
    "Happy Path Hal", "Malicious Mallory", "Edge-Case Eddie",
    "Impatient Irene", "Scale-Up Sam",
  ];

  const counts = {} as Record<TestPersona, number>;
  for (const p of allPersonas) counts[p] = 0;

  for (const tc of testCases) {
    counts[tc.persona] = (counts[tc.persona] || 0) + 1;
  }

  const missing = allPersonas.filter((p) => counts[p] === 0);
  return { counts, missing };
}
