# Test Cases Agent — Skill Definition

> Generate comprehensive, structured test cases for any codebase using 2026 agent engineering best practices.

## When to Use This Skill

- User asks to "write tests", "generate test cases", or "add test coverage"
- User wants to validate an agent, API, UI, or data pipeline
- User needs regression, edge-case, or adversarial test suites
- User asks to evaluate or benchmark an AI agent

## Research Sources (Jan 1 – Feb 13, 2026)

| Source | Key Insight |
|---|---|
| **Anthropic Advanced Tool Use (Feb 2026)** | Tool Search + Programmatic Tool Calling for large tool libraries |
| **Microsoft Agent-Pex** | Extract checkable rules from agent prompts → automated evaluation |
| **TestForge (arXiv 2503.14713)** | Iterative refinement beats single-shot: 84.3% pass rate, $0.63/file |
| **ToolFuzz (ICLR 2026)** | LLM + fuzzing finds errors in ALL LangChain tools |
| **Agent-Testing Agent (ATA)** | Meta-agent: static analysis + persona-driven adversarial generation |
| **BenchAgents** | Multi-agent decomposition: plan → generate → verify → evaluate |
| **StructTest** | Rule-based deterministic eval for compositional structured outputs |
| **Ralph Loop pattern** | Fresh context per iteration; tests as backpressure mechanism |
| **DSPy 3.0** | Signature-based prompt compilation > manual prompt engineering |
| **Chain-of-Symbol** | Symbols (↑↓[x]) outperform words for spatial/structural reasoning |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 TEST CASES AGENT                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  Phase 1: ANALYZE                                │
│  ├─ Read source code under test                  │
│  ├─ Extract function signatures, types, contracts│
│  ├─ Identify branches, edge cases, error paths   │
│  └─ Build dependency graph                       │
│                                                  │
│  Phase 2: PLAN                                   │
│  ├─ Categorize: unit / integration / e2e / fuzz  │
│  ├─ Prioritize by risk (high-branch, I/O, auth)  │
│  ├─ Define coverage targets per module            │
│  └─ Output: TEST_PLAN.json                       │
│                                                  │
│  Phase 3: GENERATE (Ralph Loop)                  │
│  ├─ Generate tests per plan item                 │
│  ├─ Run tests → capture pass/fail                │
│  ├─ On fail: diagnose, fix, re-run               │
│  ├─ On pass: commit, next item                   │
│  └─ Iterate until coverage target met            │
│                                                  │
│  Phase 4: VERIFY                                 │
│  ├─ Run full suite                               │
│  ├─ Check coverage report                        │
│  ├─ Validate structured output schema            │
│  └─ Grade: pass/fail + rubric score              │
│                                                  │
│  Phase 5: REPORT                                 │
│  └─ Output: TEST_REPORT.json + summary           │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Prompt Engineering Techniques Applied

1. **Persona**: The agent adopts the role of a senior SDET with adversarial mindset
2. **Chain-of-Symbol**: Uses symbols for branch mapping (`✓ ✗ ⚠ → ↳`) instead of verbose reasoning
3. **Structured Output**: Every phase outputs validated JSON against a defined schema
4. **Metaprompt**: System prompt is itself generated/refined by a reasoning model
5. **Few-Shot Anchoring**: Includes 2 gold-standard test case examples in every generation call
6. **Iterative Refinement**: Ralph Loop — generate → run → fix → re-run until green
7. **Specification Extraction**: Pulls testable rules directly from docstrings, types, and comments (Agent-Pex style)
8. **Adversarial Personas**: Generates tests from multiple personas (happy path user, malicious actor, edge-case explorer)

## Usage

### Quick Start (in Cursor)

Tell Cursor:
```
Generate test cases for [file/module/function] using the test-cases-agent skill.
```

### With Specific Options
```
Generate test cases for src/api/auth.ts:
- Coverage target: 90%
- Include adversarial/fuzz tests
- Output format: Jest + JSON report
- Ralph Loop: iterate until all pass
```

## Files in This Skill

| File | Purpose |
|---|---|
| `SKILL.md` | This file — skill definition and usage |
| `agent.ts` | Core agent logic — analysis, planning, generation, verification |
| `schemas.ts` | JSON schemas for test plans, test cases, and reports |
| `prompts.ts` | System prompts, few-shot examples, and persona definitions |
| `graders.ts` | Automated grading functions for test quality |

## Integration with Ralph Loop

This agent is designed to work as Phase 3 of the Interview-First → Ralph Loop workflow:

1. **Interview**: Clarify what to test, coverage targets, frameworks
2. **Synthesize**: Produce TEST_PLAN.json
3. **Ralph Loop**: Generate → Run → Fix → Repeat until done

Each Ralph Loop iteration:
- Picks one untested function/module
- Generates test cases
- Runs them
- Fixes failures
- Commits passing tests
- Updates progress tracker
- Spawns fresh context for next iteration
