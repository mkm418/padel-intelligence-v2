# AI Research Template - Workflows Guide

Complete guide to Interview-First Planning and Ralph Loop execution.

---

## Table of Contents

1. [Overview](#overview)
2. [Interview-First Planning (AskQuestion)](#interview-first-planning)
3. [Ralph Loop Execution](#ralph-loop-execution)
4. [Frontend Development Workflows](#frontend-development-workflows)
5. [Complete Workflow Example](#complete-workflow-example)
6. [Best Practices](#best-practices)
7. [Common Patterns](#common-patterns)

---

## Overview

This template uses a **two-phase workflow**:

1. **Interview-First Planning** — Extract all decisions before coding
2. **Ralph Loop Execution** — Autonomous iteration until completion

Together, they create an "Interview-Then-Execute" pattern that:
- Eliminates AI assumptions
- Reduces rework and back-and-forth
- Enables autonomous execution
- Produces better results faster

---

## Interview-First Planning

### What It Is

**AskQuestion** = Pause and ask clarifying questions instead of making assumptions.

Inspired by Claude Code's AskUserQuestion tool.

### The Three Phases

#### Phase 1: Deep Interview

When you receive a task:

1. Read the entire request carefully
2. Generate 5-10 probing questions covering:
   - Technical implementation details
   - UI/UX decisions and user flows
   - Edge cases and error handling
   - Data models and state management
   - Dependencies and integration points
   - Performance requirements
   - Trade-offs to consider
   - Things the request is silent on

3. Ask one question at a time
4. Wait for each answer
5. Keep interviewing until you can write a complete spec

#### Phase 2: Synthesis

After the interview, synthesize into:

1. **Clear requirements list** — numbered, testable items
2. **Success criteria** — what "done" looks like
3. **Technical approach** — high-level architecture
4. **Unknowns/risks** — things that might need iteration

Present this and **get explicit approval** before Phase 3.

#### Phase 3: Ralph Loop

Execute autonomously with clear completion criteria.

### Interview Categories

**Technical Implementation**
- Framework/library versions?
- Database schema specifics?
- API contracts and endpoints?
- Authentication/authorization approach?
- Error handling strategy?

**UI/UX Decisions**
- Visual style and design system?
- Responsive breakpoints?
- Loading states and skeletons?
- Empty states and zero-data states?
- Micro-interactions and animations?

**Edge Cases**
- What happens when X fails?
- What if the user does Y unexpectedly?
- How do you handle network errors?
- What about validation edge cases?

**Business Logic**
- Priority of features if time is limited?
- Non-negotiable requirements vs nice-to-haves?
- Success metrics for this feature?

**Architecture Trade-offs**
- Speed vs. completeness?
- Build vs. buy for components?
- Monolith vs. modular approach?

### Example: Competitive Intelligence

**User:** "Scrape competitor job postings"

**Agent Interview:**
```
Before I start, I need specifics:

1. Which competitors? (List of domains or companies)
2. What data to extract? (Title, location, salary, description, requirements?)
3. How many jobs per company? (All, or limit to X?)
4. Output format? (JSON, CSV, database?)
5. Update frequency? (One-time or recurring scrape?)
6. Budget constraints? (Max API cost?)
7. How to handle rate limits? (Rotate keys, wait, skip?)
```

**After answers, synthesize:**
```
Requirements:
1. Scrape 5 competitors: zendesk.com, intercom.com, ada.cx, forethought.ai, decagon.ai
2. Extract: job_title, location, department, description, requirements, posted_date
3. Limit: 50 jobs per company (250 total)
4. Output: JSON with schema validation, CSV for spreadsheet analysis
5. One-time scrape (can be re-run manually)
6. Budget: Max $10 in API costs
7. Rate limits: Rotate Firecrawl keys, retry 3x on failure

Success Criteria:
- All 5 competitors scraped successfully
- JSON validates against schema
- CSV exports cleanly to Excel
- Total cost < $10
- Export to output/competitor_jobs.json and .csv

Technical Approach:
- Use Firecrawl for crawling (auto-rotation across 102 keys)
- Parse with BeautifulSoup
- Validate with Pydantic schema
- Export with pandas

Unknowns/Risks:
- Job page structure may vary by company (need fallback parsing)
- Some companies may block scrapers (use Firecrawl's JS rendering)
- Posted dates may be relative ("2 days ago") - need date parsing

Proceed? [Y/n]
```

---

## Ralph Loop Execution

### What It Is

**Ralph** = Autonomous iterative execution until completion criteria are met.

Named after Ralph Wiggum from The Simpsons — persistent, keeps going.

### How It Works

Traditional AI coding:
```
Prompt → Response → Human Review → Next Prompt
```

Ralph Loop:
```
Requirements → Test → Fix → Test → Fix → ... → Complete
```

### Ralph Loop Principles

1. **Iteration > Perfection** — Don't aim for perfect first try
2. **Failures Are Data** — Errors are diagnostic, not roadblocks
3. **Clear Completion Criteria** — Every task has explicit "done" conditions
4. **Self-Correction** — On failure: diagnose, fix, verify, repeat

### Structure Every Task

```
Requirements:
- [Specific requirement 1]
- [Specific requirement 2]
- [Specific requirement 3]

Success Criteria:
- All requirements implemented
- Tests passing with >80% coverage
- No linter errors
- Documentation updated

Self-Verification:
- Run tests after each change
- Validate output against schema
- Check for edge cases
- Log failures with diagnostic info

Output: COMPLETE when all criteria met.
```

### Example Ralph Prompt

**Bad Prompt:**
```
"Scrape competitor pricing pages"
```

**Good Ralph Prompt:**
```
Task: Scrape competitor pricing pages and extract structured data

Requirements:
- Crawl 10 competitor websites using Firecrawl
- Extract pricing tiers, features, and limits
- Output to JSON with schema validation
- Handle rate limits and retries automatically

Success Criteria:
- All 10 sites scraped successfully
- JSON validates against schema
- No missing required fields
- Export to output/pricing_data.json
- Cost < $5 in API credits

Self-Verification:
- After each scrape: validate JSON schema
- Log failures with URL and error message
- Retry failed sites with different API key
- Track API costs and stop if exceeding budget
- Final validation: all 10 sites present in output

Failure Recovery:
- On 402 error: rotate to next API key
- On timeout: retry with longer timeout
- On parse error: log page HTML for manual review
- On validation error: fix schema and re-extract

Output: COMPLETE when all 10 sites scraped, validated, and exported.
```

### Escape Hatches

- If stuck after 3 attempts → Ask the user
- If requirements seem impossible → Surface the blocker
- If scope creep detected → Flag it and get approval
- If budget exceeded → Stop and report

---

## Frontend Development Workflows

This template includes two specialized skills for building production-grade frontend interfaces:

### Frontend Design Skill

**Location:** `skills/frontend-design/SKILL.md`

**Purpose:** Create distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics.

#### When to Use

- Building web components, pages, or applications
- Creating dashboards or data visualization interfaces
- Designing landing pages or marketing sites
- Any frontend work requiring exceptional aesthetics

#### Design Thinking Framework

Before coding, commit to a **BOLD aesthetic direction**:

1. **Purpose**: What problem does this interface solve? Who uses it?
2. **Tone**: Pick an extreme aesthetic:
   - Brutally minimal
   - Maximalist chaos
   - Retro-futuristic
   - Organic/natural
   - Luxury/refined
   - Playful/toy-like
   - Editorial/magazine
   - Brutalist/raw
   - Art deco/geometric
   - Industrial/utilitarian

3. **Constraints**: Technical requirements, browser support, performance budgets
4. **Differentiation**: What makes this UNFORGETTABLE?

#### Key Guidelines

**Typography:**
- Choose distinctive fonts (avoid Inter, Roboto, Arial, system fonts)
- Pair a display font with a refined body font
- Consider weight, spacing, line height carefully

**Color & Theme:**
- Commit to a cohesive aesthetic
- Use CSS variables for consistency
- Dominant colors with sharp accents
- Avoid purple gradients on white (cliché)

**Motion & Animation:**
- Use CSS animations for micro-interactions
- Focus on high-impact moments (page load, staggered reveals)
- Scroll-triggering and surprising hover states

**Spatial Composition:**
- Unexpected layouts (asymmetry, overlap, diagonal flow)
- Grid-breaking elements
- Generous negative space OR controlled density

**Backgrounds & Visual Details:**
- Create atmosphere and depth
- Gradient meshes, noise textures, geometric patterns
- Layered transparencies, dramatic shadows
- Decorative borders, custom cursors

#### Example: Data Dashboard

**Interview Questions:**
```
1. What data should appear? (metrics, charts, tables?)
2. Who's the primary user? (developer, executive, analyst?)
3. Real-time or periodic refresh?
4. Existing design system? (colors, fonts, components?)
5. Key metrics that must be above the fold?
```

**Design Direction (Brutalist):**
```
- Monospace fonts throughout (IBM Plex Mono)
- High contrast black/white with red accents
- Grid-based layout with exposed structure
- No rounded corners, stark rectangles
- Minimal animations, focus on data clarity
- Raw data tables with hover states
```

**Implementation:**
```typescript
// Distinctive typography
font-family: 'IBM Plex Mono', monospace;
font-weight: 500;
letter-spacing: -0.02em;

// High contrast colors
--bg: #000000;
--fg: #ffffff;
--accent: #ff0000;
--grid: #333333;

// Stark layout
display: grid;
grid-template-columns: repeat(12, 1fr);
gap: 1px;
background: var(--grid);

// Minimal animations
transition: background 0.15s ease;
```

### React Best Practices Skill

**Location:** `skills/react-best-practices/AGENTS.md`

**Purpose:** Performance optimization for React and Next.js applications.

#### When to Use

- Building or optimizing React/Next.js applications
- Reviewing code for performance issues
- Refactoring components for better performance
- Setting up new projects with best practices

#### Priority Order (CRITICAL First)

**1. Eliminate Waterfalls (CRITICAL)**
- Defer await until needed
- Use Promise.all() for independent operations
- Dependency-based parallelization
- Strategic Suspense boundaries

**2. Bundle Size Optimization (CRITICAL)**
- Avoid barrel file imports (use direct imports)
- Dynamic imports for heavy components
- Defer non-critical third-party libraries
- Conditional module loading

**3. Server-Side Performance (HIGH)**
- Authenticate Server Actions
- Parallel data fetching with component composition
- Per-request deduplication with React.cache()
- Use after() for non-blocking operations

**4. Client-Side Data Fetching (MEDIUM-HIGH)**
- Use SWR for automatic deduplication
- Deduplicate global event listeners
- Use passive event listeners for scrolling

**5. Re-render Optimization (MEDIUM)**
- Use lazy state initialization
- Extract to memoized components
- Narrow effect dependencies
- Use transitions for non-urgent updates

#### Example: Optimize Data Dashboard

**Before (Waterfalls):**
```typescript
async function DashboardPage() {
  const user = await fetchUser()
  const config = await fetchConfig()
  const metrics = await fetchMetrics(user.id)
  
  return <Dashboard user={user} config={config} metrics={metrics} />
}
```

**After (Parallel Fetching):**
```typescript
async function DashboardPage() {
  const userPromise = fetchUser()
  const configPromise = fetchConfig()
  const user = await userPromise
  
  const [config, metrics] = await Promise.all([
    configPromise,
    fetchMetrics(user.id)
  ])
  
  return <Dashboard user={user} config={config} metrics={metrics} />
}
```

**Before (Bundle Size):**
```typescript
import { Check, X, Menu, Settings, User, Home } from 'lucide-react'
// Loads 1,583 modules, ~800ms import cost
```

**After (Direct Imports):**
```typescript
import Check from 'lucide-react/dist/esm/icons/check'
import X from 'lucide-react/dist/esm/icons/x'
import Menu from 'lucide-react/dist/esm/icons/menu'
// Loads only 3 modules, ~5ms import cost
```

### Combining Frontend Skills

**Use both skills together for:**
- Beautiful, performant web applications
- Stunning dashboards with optimized data fetching
- Marketing sites with distinctive design and fast load times
- Complex UIs with exceptional UX and technical excellence

**Example Workflow:**
1. **Interview**: Understand requirements, audience, constraints
2. **Design**: Choose aesthetic direction (Frontend Design Skill)
3. **Implement**: Build with performance in mind (React Best Practices)
4. **Iterate**: Test, optimize, refine (Ralph Loop)

---

## Complete Workflow Example

### Scenario: Build Competitor Intelligence Dashboard

**Step 1: User Request**
```
"Build a dashboard showing competitor job postings, G2 reviews, and pricing"
```

**Step 2: Interview (Phase 1)**
```
Agent: Before I start, I need to understand the specifics:

1. Which competitors should be tracked?
2. What data from job postings? (Title, location, department, salary?)
3. What metrics from G2 reviews? (Rating, sentiment, themes?)
4. How should pricing be displayed? (Table, comparison, trends?)
5. Update frequency? (Real-time, daily, weekly?)
6. Who's the audience? (Internal team, executives, sales?)
7. Tech stack preferences? (Static HTML, React, dashboard tool?)
8. Budget constraints? (API costs, hosting?)
```

**Step 3: Synthesis (Phase 2)**
```
Agent: Based on your answers, here's the plan:

Requirements:
1. Track 5 competitors: Zendesk, Intercom, Ada, Forethought, Decagon
2. Job postings: Title, location, department, posted_date (last 30 days)
3. G2 reviews: Average rating, review count, sentiment breakdown, top themes
4. Pricing: Tiers, features, limits (static snapshot, updated weekly)
5. Update: Daily automated scrape at 6am
6. Audience: Internal product & sales teams
7. Tech: Static HTML dashboard (no server needed)
8. Budget: Max $20/day in API costs

Success Criteria:
- All 5 competitors scraped daily
- Dashboard updates automatically
- Data validates against schemas
- Export to output/dashboard/index.html
- Cost < $20/day

Technical Approach:
- Firecrawl for job pages & pricing
- Apify for G2 reviews
- Python for data processing
- HTML/CSS/JS for dashboard
- GitHub Actions for scheduling

Proceed? [Y/n]
```

**Step 4: Ralph Loop (Phase 3)**
```
Agent: Starting Ralph Loop execution...

Phase 1: Job Postings Scraper
Requirements:
- Scrape 5 competitor career pages
- Extract job data
- Validate schema
- Export to JSON

[Iteration 1] Scraping zendesk.com/careers...
[Test] Schema validation: PASS
[Iteration 2] Scraping intercom.com/careers...
[Test] Schema validation: FAIL (missing posted_date)
[Fix] Added date parser for relative dates
[Test] Schema validation: PASS
[Iteration 3] Scraping ada.cx/careers...
[Test] Schema validation: PASS
[Iteration 4] Scraping forethought.ai/careers...
[Test] Schema validation: PASS
[Iteration 5] Scraping decagon.ai/careers...
[Test] Schema validation: PASS

Phase 1: COMPLETE ✓

Phase 2: G2 Reviews Scraper
[... similar iteration pattern ...]

Phase 2: COMPLETE ✓

Phase 3: Pricing Scraper
[... similar iteration pattern ...]

Phase 3: COMPLETE ✓

Phase 4: Dashboard Builder
[... similar iteration pattern ...]

Phase 4: COMPLETE ✓

All phases complete. Dashboard exported to output/dashboard/index.html
Total cost: $12.50 (under budget)
```

---

## Best Practices

### Interview-First

1. **Always interview for complex tasks** — Even if you think you know
2. **Ask one question at a time** — Don't overwhelm with 10 questions at once
3. **Wait for answers** — Don't proceed with assumptions
4. **Synthesize before executing** — Get explicit approval
5. **Document decisions** — Reference them during execution

### Ralph Loop

1. **Clear completion criteria** — Must be programmatically verifiable
2. **Self-verification** — Automated tests, not human review
3. **Failure recovery** — Define what to do when things break
4. **Escape hatches** — Know when to stop and ask for help
5. **Budget constraints** — Set max cost and stop if exceeded

### Combined Workflow

1. **Interview depth ∝ complexity** — Simple tasks need fewer questions
2. **Synthesize always** — Even for simple tasks, confirm understanding
3. **Ralph for execution** — Let it iterate autonomously
4. **Monitor progress** — Check logs, costs, outputs
5. **Iterate on failures** — Use failures as diagnostic info

---

## Common Patterns

### Pattern 1: Data Collection

**Interview Focus:**
- Data sources and access methods
- Data schema and validation rules
- Update frequency and scheduling
- Budget and rate limit handling

**Ralph Focus:**
- Iterate through sources
- Validate each result
- Handle failures gracefully
- Export when complete

### Pattern 2: Content Generation

**Interview Focus:**
- Target audience and tone
- Content structure and format
- Examples and references
- Quality criteria

**Ralph Focus:**
- Generate draft
- Self-review against criteria
- Refine based on feedback
- Finalize when criteria met

### Pattern 3: Competitive Analysis

**Interview Focus:**
- Competitors to track
- Metrics and KPIs
- Comparison framework
- Output format

**Ralph Focus:**
- Scrape each competitor
- Extract and normalize data
- Compare and analyze
- Generate report

### Pattern 4: Research + Frontend Integration

**Interview Focus:**
- Data sources and collection methods
- Visualization requirements
- User interactions and workflows
- Performance and update frequency

**Ralph Focus:**
- Phase 1: Collect and validate data
- Phase 2: Build frontend with chosen aesthetic
- Phase 3: Optimize performance
- Phase 4: Test and refine

---

## Integration Examples (Research + Frontend)

### Example 1: SEO Opportunity Dashboard

**Scenario:** Build a dashboard that finds and displays SEO opportunities using Semrush data.

**Interview Phase:**
```
1. What SEO metrics matter most? (keyword difficulty, search volume, ranking?)
2. How many keywords to track? (10, 100, 1000?)
3. Update frequency? (real-time, daily, weekly?)
4. Who's the audience? (SEO team, executives, clients?)
5. Aesthetic preference? (data-focused, executive-friendly, playful?)
6. Budget constraints? (Semrush API costs?)
```

**Synthesis:**
```
Requirements:
- Track 500 keywords across 5 domains
- Display: difficulty, volume, position, trend
- Update: Daily at 6am
- Audience: Internal SEO team
- Aesthetic: Brutalist data-focused design
- Budget: Max $50/day in API costs

Tech Stack:
- Semrush API for keyword data
- React + Next.js for frontend
- Tailwind CSS for styling
- Recharts for visualizations
```

**Ralph Loop Execution:**
```
Phase 1: Data Collection (Semrush)
- Fetch keyword data for 5 domains
- Validate schema and store in JSON
- Track API costs
- COMPLETE ✓

Phase 2: Frontend (Design + React)
- Choose brutalist aesthetic (monospace, high contrast)
- Build keyword table with sorting/filtering
- Add trend charts with Recharts
- Implement responsive layout
- COMPLETE ✓

Phase 3: Performance Optimization
- Eliminate data fetching waterfalls
- Use direct imports for icons
- Add lazy loading for charts
- Optimize bundle size
- COMPLETE ✓

Phase 4: Testing & Refinement
- Test data refresh flow
- Verify API cost tracking
- Check responsive breakpoints
- Fix any linter errors
- COMPLETE ✓

Output: Dashboard at output/seo-dashboard/index.html
Total cost: $32/day (under budget)
```

### Example 2: Competitive Intelligence Webapp

**Scenario:** Scrape competitor websites and display insights in a beautiful interface.

**Interview Phase:**
```
1. Which competitors? (domains or company names?)
2. What data to collect? (pricing, features, job postings, blog posts?)
3. How to display? (comparison table, individual profiles, trends?)
4. Update frequency? (manual, scheduled, real-time?)
5. Aesthetic direction? (luxury, minimal, editorial, playful?)
6. Tech stack preference? (static HTML, React, Vue?)
```

**Synthesis:**
```
Requirements:
- Track 3 competitors: Intercom, Zendesk, Freshdesk
- Collect: pricing tiers, features, latest blog posts, job openings
- Display: Individual competitor profiles + comparison view
- Update: Manual trigger (can re-run anytime)
- Aesthetic: Editorial/magazine style (strong typography, grid-based)
- Tech: React + Next.js (static export)

Tools:
- Firecrawl for web scraping
- Apify for structured data extraction
- React for frontend
- Framer Motion for animations
```

**Ralph Loop Execution:**
```
Phase 1: Data Collection (Firecrawl + Apify)
- Scrape pricing pages with Firecrawl
- Extract blog posts with Apify
- Scrape job postings with Firecrawl
- Validate all data schemas
- Export to JSON
- COMPLETE ✓

Phase 2: Frontend Design (Editorial Style)
- Choose editorial aesthetic:
  * Display font: Playfair Display
  * Body font: Source Sans Pro
  * Grid-based layout with strong hierarchy
  * Black/white with gold accents
  * Subtle fade-in animations
- Build competitor profile cards
- Create comparison table
- Add blog post feed
- Implement job listings
- COMPLETE ✓

Phase 3: Performance Optimization
- Use Promise.all() for parallel data fetching
- Direct imports for icons (lucide-react)
- Dynamic import for comparison view
- Optimize images and fonts
- COMPLETE ✓

Phase 4: Polish & Testing
- Add loading states with skeletons
- Implement error handling
- Test responsive breakpoints
- Add micro-interactions on hover
- COMPLETE ✓

Output: Webapp at output/competitor-intel/
Build size: 180KB (optimized)
```

### Example 3: Market Research Portal

**Scenario:** Combine Exa semantic search, Perplexity research, and Serper Google search into a unified research portal.

**Interview Phase:**
```
1. What research workflows? (company discovery, trend analysis, news monitoring?)
2. How to organize results? (by source, by topic, by date?)
3. Search interface? (simple input, advanced filters, saved searches?)
4. Aesthetic direction? (academic, modern, playful, professional?)
5. User personas? (researchers, analysts, executives?)
```

**Synthesis:**
```
Requirements:
- Support 3 workflows:
  * Company discovery (Exa)
  * Deep research (Perplexity)
  * News monitoring (Serper)
- Organize: Tabbed interface by workflow
- Search: Simple input + advanced filters
- Aesthetic: Modern professional (refined minimalism)
- Users: Research analysts

Tech Stack:
- Exa, Perplexity, Serper APIs
- React + TypeScript
- Tailwind CSS
- SWR for data fetching
```

**Ralph Loop Execution:**
```
Phase 1: API Integration
- Integrate Exa client
- Integrate Perplexity client
- Integrate Serper client
- Create unified search interface
- Add error handling and retries
- COMPLETE ✓

Phase 2: Frontend (Refined Minimalism)
- Choose aesthetic:
  * Font: Inter (refined, not generic - used intentionally)
  * Colors: Soft grays with blue accents
  * Generous whitespace
  * Subtle shadows and depth
  * Smooth transitions
- Build tabbed interface
- Create search input with autocomplete
- Design result cards for each source
- Add filters and sorting
- COMPLETE ✓

Phase 3: Performance Optimization
- Use SWR for automatic deduplication
- Implement lazy state initialization
- Add Suspense boundaries for async data
- Optimize re-renders with memoization
- COMPLETE ✓

Phase 4: Advanced Features
- Save search history to localStorage
- Export results to JSON/CSV
- Add keyboard shortcuts
- Implement dark mode toggle
- COMPLETE ✓

Output: Research portal at output/research-portal/
Features: 3 integrated tools, optimized performance, polished UX
```

### Key Patterns for Integration

**1. Data Collection → Visualization**
- Collect data with research tools (Firecrawl, Semrush, etc.)
- Design visualization with Frontend Design Skill
- Optimize with React Best Practices
- Iterate until complete (Ralph Loop)

**2. API Integration → User Interface**
- Integrate APIs with proper error handling
- Build interface with distinctive aesthetic
- Optimize data fetching patterns
- Polish with animations and micro-interactions

**3. Research Workflow → Dashboard**
- Define research workflow and data needs
- Collect data from multiple sources
- Unify in a cohesive dashboard
- Optimize for performance and UX

---

## Real-World Results

**Interview-First + Ralph Loop** has been used successfully for:

- Geoffrey Huntley: $50k contract for $297 in API costs
- Boris Cherny: 259 pull requests in 30 days, all AI-written
- Anthropic: Official Ralph plugin released

**Key Success Factor:** Prompt quality is everything.

---

## Next Steps

1. Read `.cursor/rules/interview-first.mdc` for full AskQuestion workflow
2. Read `.cursor/rules/ralph-loop.mdc` for full Ralph Loop pattern
3. See `API_REFERENCE.md` for tool-specific examples
4. See `KEY_ROTATION.md` for key management best practices

---

**Remember:** Interview first, execute second. The time spent interviewing is always less than the time spent fixing assumptions.
