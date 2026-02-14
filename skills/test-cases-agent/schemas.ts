/**
 * schemas.ts — JSON schemas and TypeScript types for the test cases agent
 *
 * Incorporates 2026 best practices:
 * - StructTest-style deterministic validation
 * - Compositional schemas with strict enum constraints
 * - Runtime validation functions (no external deps)
 */

// ─── TypeScript Types ────────────────────────────────────────────────────────

/** Branch symbols used in Chain-of-Symbol analysis */
export type BranchSymbol = "✓" | "✗" | "⚠" | "→" | "↳" | "◆" | "🔒";

/** Test category taxonomy */
export type TestCategory =
  | "unit"
  | "integration"
  | "e2e"
  | "fuzz"
  | "security"
  | "performance";

/** Adversarial personas for test generation */
export type TestPersona =
  | "Happy Path Hal"
  | "Malicious Mallory"
  | "Edge-Case Eddie"
  | "Impatient Irene"
  | "Scale-Up Sam";

/** Complexity levels for function risk assessment */
export type Complexity = "low" | "medium" | "high" | "critical";

/** A single step in a test case */
export interface TestStep {
  action: string;
  input: string;
  expected: string;
}

/** A single test case specification */
export interface TestCase {
  id: string; // kebab-case unique identifier
  category: TestCategory;
  priority: number; // 1 (critical) – 5 (nice-to-have)
  targetFunction: string;
  targetFile: string;
  branchSymbol: BranchSymbol;
  persona: TestPersona;
  title: string;
  description: string;
  preconditions: string[];
  steps: TestStep[];
  expectedResult: string;
  assertions: string[]; // Programmatic assertion strings
  tags: string[];
}

/** Function analysis from Phase 1 */
export interface FunctionAnalysis {
  name: string;
  signature: string;
  branchMap: string; // Symbol-annotated multi-line string
  complexity: Complexity;
  dependencies: string[];
  totalBranches: number;
  riskScore: number; // 1–10
}

/** Full file analysis output */
export interface AnalysisResult {
  file: string;
  functions: FunctionAnalysis[];
  summary: {
    totalFunctions: number;
    totalBranches: number;
    highRiskFunctions: string[];
  };
}

/** Test plan output from Phase 2 */
export interface TestPlan {
  planId: string;
  targetCoverage: number;
  totalTestCases: number;
  categories: Record<TestCategory, number>;
  testCases: TestCase[];
}

/** Individual test grade from Phase 4 */
export interface TestGrade {
  testId: string;
  scores: {
    specificity: number; // 0–3
    uniqueness: number;
    realism: number;
    completeness: number;
    adversarial: number;
  };
  totalScore: number; // 0–15
  pass: boolean; // totalScore >= 10
  feedback: string;
}

/** Verification report */
export interface VerificationReport {
  grades: TestGrade[];
  summary: {
    totalTests: number;
    passing: number;
    failing: number;
    averageScore: number;
    weakestDimension: string;
  };
}

/** Final test report output */
export interface TestReport {
  reportId: string;
  timestamp: string;
  analysis: AnalysisResult;
  plan: TestPlan;
  verification: VerificationReport;
  generatedCode: {
    framework: string;
    language: string;
    files: Array<{ path: string; content: string }>;
  };
  metrics: {
    totalTestCases: number;
    passingGrade: number;
    failingGrade: number;
    averageQualityScore: number;
    coverageEstimate: number;
    categoryCounts: Record<TestCategory, number>;
    personaCounts: Record<TestPersona, number>;
    branchCoverage: Record<BranchSymbol, number>;
  };
}

// ─── JSON Schemas (for structured output enforcement) ───────────────────────

export const TEST_CASE_JSON_SCHEMA = {
  type: "object",
  required: [
    "id", "category", "priority", "targetFunction", "targetFile",
    "branchSymbol", "persona", "title", "description", "preconditions",
    "steps", "expectedResult", "assertions", "tags",
  ],
  properties: {
    id: { type: "string", pattern: "^[a-z0-9-]+$" },
    category: { type: "string", enum: ["unit", "integration", "e2e", "fuzz", "security", "performance"] },
    priority: { type: "number", minimum: 1, maximum: 5 },
    targetFunction: { type: "string", minLength: 1 },
    targetFile: { type: "string", minLength: 1 },
    branchSymbol: { type: "string", enum: ["✓", "✗", "⚠", "→", "↳", "◆", "🔒"] },
    persona: { type: "string", enum: ["Happy Path Hal", "Malicious Mallory", "Edge-Case Eddie", "Impatient Irene", "Scale-Up Sam"] },
    title: { type: "string", minLength: 5 },
    description: { type: "string", minLength: 10 },
    preconditions: { type: "array", items: { type: "string" } },
    steps: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["action", "input", "expected"],
        properties: {
          action: { type: "string" },
          input: { type: "string" },
          expected: { type: "string" },
        },
      },
    },
    expectedResult: { type: "string", minLength: 10 },
    assertions: { type: "array", minItems: 1, items: { type: "string" } },
    tags: { type: "array", items: { type: "string" } },
  },
} as const;

// ─── Runtime Validators ─────────────────────────────────────────────────────

/** Validate a test case object against the schema (lightweight, no deps) */
export function validateTestCase(tc: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!tc || typeof tc !== "object") return { valid: false, errors: ["Not an object"] };

  const obj = tc as Record<string, unknown>;

  // Required fields
  const required = TEST_CASE_JSON_SCHEMA.required;
  for (const field of required) {
    if (!(field in obj)) errors.push(`Missing required field: ${field}`);
  }

  // Type checks
  if (typeof obj.id === "string" && !/^[a-z0-9-]+$/.test(obj.id)) {
    errors.push(`id must be kebab-case: ${obj.id}`);
  }

  const validCategories = ["unit", "integration", "e2e", "fuzz", "security", "performance"];
  if (!validCategories.includes(obj.category as string)) {
    errors.push(`Invalid category: ${obj.category}`);
  }

  if (typeof obj.priority === "number" && (obj.priority < 1 || obj.priority > 5)) {
    errors.push(`Priority must be 1-5: ${obj.priority}`);
  }

  const validSymbols = ["✓", "✗", "⚠", "→", "↳", "◆", "🔒"];
  if (!validSymbols.includes(obj.branchSymbol as string)) {
    errors.push(`Invalid branchSymbol: ${obj.branchSymbol}`);
  }

  if (Array.isArray(obj.assertions) && obj.assertions.length === 0) {
    errors.push("assertions must have at least one entry");
  }

  if (Array.isArray(obj.steps) && obj.steps.length === 0) {
    errors.push("steps must have at least one entry");
  }

  // Check for vague assertions (quality gate)
  if (Array.isArray(obj.assertions)) {
    for (const a of obj.assertions) {
      if (typeof a === "string") {
        const vague = ["should work", "should be correct", "should be fine", "should succeed"];
        if (vague.some((v) => a.toLowerCase().includes(v))) {
          errors.push(`Vague assertion detected: "${a}" — must be programmatic`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Validate an entire test plan */
export function validateTestPlan(plan: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!plan || typeof plan !== "object") return { valid: false, errors: ["Not an object"] };

  const obj = plan as Record<string, unknown>;

  if (!obj.planId) errors.push("Missing planId");
  if (typeof obj.targetCoverage !== "number") errors.push("Missing/invalid targetCoverage");
  if (!Array.isArray(obj.testCases)) errors.push("testCases must be an array");

  // Validate each test case
  if (Array.isArray(obj.testCases)) {
    const ids = new Set<string>();
    for (let i = 0; i < obj.testCases.length; i++) {
      const result = validateTestCase(obj.testCases[i]);
      if (!result.valid) {
        errors.push(`testCases[${i}]: ${result.errors.join(", ")}`);
      }
      // Check for duplicate IDs
      const tc = obj.testCases[i] as Record<string, unknown>;
      if (typeof tc.id === "string") {
        if (ids.has(tc.id)) errors.push(`Duplicate test case ID: ${tc.id}`);
        ids.add(tc.id);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
