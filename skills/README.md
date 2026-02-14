# Skills Directory

This directory contains modular skill files that provide specialized knowledge and workflows for AI agents working in Cursor.

## Available Skills

### 1. Frontend Design
**Path:** `frontend-design/SKILL.md`  
**Purpose:** Create distinctive, production-grade frontend interfaces with high design quality

**Use when:**
- Building web components, pages, or applications
- Creating dashboards or data visualization interfaces
- Designing landing pages or marketing sites
- Any frontend work requiring exceptional aesthetics

**Key Features:**
- Design thinking framework (purpose, tone, constraints, differentiation)
- Aesthetics guidelines (typography, color, motion, composition)
- Anti-patterns to avoid generic "AI slop" design
- Framework-agnostic (HTML/CSS/JS, React, Vue, Svelte, etc.)

### 2. React Best Practices
**Path:** `react-best-practices/AGENTS.md`  
**Purpose:** Performance optimization for React and Next.js applications

**Use when:**
- Building or optimizing React/Next.js applications
- Reviewing code for performance issues
- Refactoring components for better performance
- Setting up new projects with best practices

**Key Features:**
- 40+ rules across 8 categories (waterfalls, bundle size, SSR, etc.)
- Prioritized by impact (CRITICAL → LOW)
- Real-world examples with before/after code
- Specific metrics and optimization strategies

## How to Use These Skills

### In Cursor

These skills are automatically available to Cursor's AI through the workspace rules system. When you ask Cursor to build frontend interfaces or optimize React code, it will reference these skills automatically.

---

## Conductor agent skills (padel app)

These are the “specialist agents” used by Conductor (see `.cursor/CONDUCTOR_WORKFLOW.md`).

- **PM / Spec**: `pm-agent/SKILL.md`
- **Designer**: `designer-agent/SKILL.md`
- **Backend**: `backend-agent/SKILL.md`
- **Frontend**: `frontend-agent/SKILL.md`
- **Data engineer (events tracking)**: `data-engineer-events-tracking/SKILL.md`
- **QA / Review**: `qa-agent/SKILL.md` (+ `test-cases-agent/` for test plan generation)
- **DevOps / SRE**: `devops-sre-agent/SKILL.md`
- **Growth / SEO**: `growth-seo-agent/SKILL.md`

### Manual Reference

You can also explicitly reference these skills in your prompts:

```
"Build a dashboard using the frontend-design skill guidelines"
"Optimize this React component following react-best-practices"
"Create a landing page with a brutalist aesthetic (see frontend-design)"
```

## Skill Integration

These skills work together:

- **Frontend Design + React Best Practices** = Beautiful, performant web apps
- **Research Tools + Frontend Design** = Stunning dashboards for data visualization
- **API Integration + React Best Practices** = Optimized data fetching patterns

## Adding New Skills

To add a new skill:

1. Create a new directory: `skills/your-skill-name/`
2. Add documentation: `SKILL.md` or `AGENTS.md`
3. Update this README with the new skill
4. Reference it in `.cursorrules` if needed

## Sources

- **frontend-design**: [Anthropic Claude Code Skills](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design)
- **react-best-practices**: [Vercel Labs Agent Skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)
