---
name: devops-sre-agent
description: DevOps/SRE guidance for local reproducibility, CI, secrets management, and incident response. Use when setting up environments, pipelines, runbooks, or shipping local-only deployments.
---

# DevOps/SRE Agent Skill

Guidance for reproducible local environments, CI pipelines, secrets handling, and incident response. Optimized for **local-only shipping** (no cloud dependencies for initial deploy).

---

## When to Use This Skill

- Setting up local dev environments or reproducibility scripts
- Designing or implementing CI/CD pipelines
- Handling secrets, env vars, or credentials
- Creating or updating runbooks
- Incident response and postmortems
- Pre-ship checklists and validation

---

## 1. Local Reproducibility Scripts

### Bootstrap Script (`scripts/bootstrap.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
# One-command local setup. Idempotent where possible.

echo "→ Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "Node required"; exit 1; }
command -v pnpm >/dev/null 2>&1 || npm i -g pnpm

echo "→ Installing dependencies..."
pnpm install

echo "→ Copying env template..."
cp -n .env.example .env 2>/dev/null || true

echo "→ Running migrations (if any)..."
pnpm run db:migrate 2>/dev/null || true

echo "→ Verifying..."
pnpm run build
echo "✓ Bootstrap complete. Run: pnpm dev"
```

### Clean Rebuild Script (`scripts/clean-rebuild.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
# Full clean rebuild for reproducible state.

rm -rf node_modules .next dist build .turbo
pnpm install
pnpm run build
echo "✓ Clean rebuild complete"
```

### Reproducibility Checklist

- [ ] `scripts/bootstrap.sh` runs from fresh clone
- [ ] `.env.example` documents all required vars (no secrets)
- [ ] `pnpm install` + `pnpm run build` succeeds
- [ ] README has "Local setup" section with exact commands

---

## 2. CI Plan

### Minimal CI (Local-First)

| Stage | Job | Trigger |
|-------|-----|---------|
| Lint | `pnpm lint` | Push, PR |
| Typecheck | `pnpm typecheck` or `tsc --noEmit` | Push, PR |
| Test | `pnpm test` | Push, PR |
| Build | `pnpm build` | Push, PR |

### CI Config Skeleton (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

### CI Checklist

- [ ] Lint, typecheck, test, build all run
- [ ] Lockfile frozen in CI (`--frozen-lockfile` / `ci`)
- [ ] No secrets in workflow files
- [ ] Fail fast on first error

---

## 3. Secrets Rules

### Do

- Use `.env` for local dev; add `.env` to `.gitignore`
- Provide `.env.example` with placeholder keys (e.g. `API_KEY=your_key_here`)
- Use env vars at runtime, never hardcode
- Rotate secrets if ever exposed

### Never

- Commit `.env`, `.env.local`, or any file with real secrets
- Put secrets in CI workflow files (use repo secrets/vault)
- Log secrets or include them in error messages
- Share secrets in chat, docs, or screenshots

### `.gitignore` Entries

```
.env
.env.local
.env.*.local
*.pem
secrets/

## Research sources (Jan 1, 2026 → Feb 13, 2026)

- **Runbooks that actually work (published 2026-02-02)**: `https://oneuptime.com/blog/post/2026-02-02-effective-runbooks/view`
- **Suite research log (this repo)**: `output/research/agent-suite-research-20260101-20260213.md`
```

### Secrets Checklist

- [ ] `.env` in `.gitignore`
- [ ] `.env.example` exists and is committed
- [ ] No real secrets in repo history
- [ ] CI uses repo secrets for any external APIs

---

## 4. Runbook Template

```markdown
# Runbook: [Service/Component Name]

## Overview
Brief description and ownership.

## Prerequisites
- Access: [who, how]
- Tools: [CLI, dashboards, logs]

## Normal Operation
- Start: `pnpm dev` or `./scripts/start.sh`
- Health check: `curl http://localhost:3000/health`
- Expected behavior: [1–2 sentences]

## Common Incidents

### [Incident 1: e.g. "App won't start"]
**Symptoms:** [What you see]
**Cause:** [Likely reason]
**Fix:**
1. [Step 1]
2. [Step 2]
3. Verify: [How to confirm fixed]

### [Incident 2: e.g. "Build fails"]
**Symptoms:** [What you see]
**Cause:** [Likely reason]
**Fix:**
1. [Step 1]
2. [Step 2]

## Escalation
- [Contact or link]
- [Logs location]
```

---

## 5. Checklists

### Pre-Ship (Local-Only)

- [ ] `scripts/bootstrap.sh` succeeds from clean clone
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] `.env.example` is complete
- [ ] No secrets in repo
- [ ] README has setup instructions

### Post-Incident

- [ ] Incident documented in runbook
- [ ] Root cause identified
- [ ] Fix or mitigation applied
- [ ] Secrets rotated if exposed

---

## Output

When applying this skill, produce:

1. **Scripts** — Executable, idempotent where possible
2. **Config** — CI YAML, `.env.example`, `.gitignore` updates
3. **Docs** — Runbook entries, README setup section
4. **Checklists** — Used to validate before ship
