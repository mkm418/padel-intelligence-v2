## SEO Plan

### Scope

- **Target app**: padel-finder | padel-passport-preview
- **Routes/pages touched**:
- **Ship date**:

### Indexing policy (critical)

| Route type | Example | Index? | Canonical target | Notes |
|---|---|---:|---|---|
| Hub page | `/clubs` | yes | self | |
| Programmatic detail | `/player/[id]` | yes/no | self | only if stable + valuable |
| Faceted/filter | `/search?...` | usually no | hub | avoid crawl traps |
| Combinatorial | `/compare?...` | curated only | hub | prevent infinite pairs |

### Metadata

- **Title templates**:
- **Description templates**:
- **OpenGraph/Twitter**:
- **Canonical rules**:
- **Noindex rules**:

### Structured data (JSON-LD)

| Page | Schema type | Where implemented | Validation |
|---|---|---|---|
|  |  |  | Rich Results Test |

### Internal linking

- Hub → detail links:
- Pagination strategy:
- Avoid orphan pages:

### Performance guardrails (SEO + UX)

- CWV target: LCP <= 2.5s, INP <= 200ms, CLS < 0.1
- Bundle / waterfalls: follow `skills/react-best-practices/AGENTS.md`

### Measurement

- **Primary KPI**:
- **Secondary KPIs**:
- **Baseline**:
- **How to measure** (GSC, logs, analytics):

