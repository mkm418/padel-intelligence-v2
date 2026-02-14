# AI Research Template - API Reference

Quick reference for all API tools with usage examples.

---

## Table of Contents

1. [Firecrawl](#firecrawl) - Website crawling
2. [Apify](#apify) - Pre-built scrapers
3. [SEMrush](#semrush) - SEO analysis
4. [Exa](#exa) - Semantic company search
5. [Perplexity](#perplexity) - AI research
6. [Serper](#serper) - Google SERP
7. [Other Tools](#other-tools)

---

## Firecrawl

**Purpose:** Website crawling, markdown extraction, structured data

**Keys:** 102 keys, 1.4M+ credits  
**Auto-rotation:** ✅ Credit-aware load balancing

### Basic Usage

```python
from tools.firecrawl import FirecrawlClient

# Initialize with auto load balancing
client = FirecrawlClient(load_balancing="auto")

# Crawl a website
result = client.crawl("https://competitor.com", max_pages=50)
print(f"Crawled {len(result['pages'])} pages")

# Scrape a single page
page = client.scrape("https://competitor.com/pricing")
print(page['markdown'])

# Check credits
stats = client.get_key_usage_stats()
print(f"Total credits: {stats['total_credits']:,}")
```

### Advanced Usage

```python
# Crawl with custom options
result = client.crawl(
    url="https://competitor.com",
    max_pages=100,
    include_paths=["/blog/*", "/docs/*"],
    exclude_paths=["/legal/*"],
    timeout=60
)

# Extract structured data
schema = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "price": {"type": "number"},
        "features": {"type": "array"}
    }
}

data = client.extract("https://competitor.com/pricing", schema=schema)
print(data)

# Refresh credit cache
client.refresh_credit_cache()
```

### Cost Estimation

- Crawl: ~$0.01-0.05 per page
- Scrape: ~$0.001-0.01 per page
- Extract: ~$0.01-0.05 per extraction

---

## Apify

**Purpose:** Pre-built scrapers for G2, LinkedIn, Reddit, etc.

**Keys:** 40+ keys with auto-rotation  
**Cost tracking:** ✅ Usage monitoring

### Basic Usage

```python
from tools.apify import ApifyKeyManager, ApifyClientWrapper
from tools.config import APIFY_API_KEYS

# Initialize
manager = ApifyKeyManager(APIFY_API_KEYS)
client = ApifyClientWrapper(manager)

# Check key status
manager.display_status()

# Run G2 reviews scraper
result = client.run_actor(
    actor_id="apify/g2-reviews-scraper",
    input_params={
        "productUrl": "https://www.g2.com/products/zendesk/reviews",
        "maxReviews": 100
    }
)

print(f"Scraped {len(result['items'])} reviews")
print(f"Cost: ${result['cost']:.3f}")
```

### Available Actors

```python
from tools.config import APIFY_ACTORS

# Pre-configured actors
actors = {
    "g2_reviews": "apify/g2-reviews-scraper",
    "linkedin_jobs": "bebity/linkedin-jobs-scraper",
    "reddit": "trudax/reddit-scraper",
    "google_news": "apify/google-news-scraper",
    "trustpilot": "apify/trustpilot-scraper",
    "capterra": "epctex/capterra-scraper",
}

# Run LinkedIn jobs scraper
result = client.run_actor(
    actor_id=actors["linkedin_jobs"],
    input_params={
        "company": "zendesk",
        "maxJobs": 50
    }
)
```

### Cost Estimation

```python
from tools.apify import estimate_project_cost

tasks = [
    {"actor_id": "apify/g2-reviews-scraper", "input": {"maxReviews": 100}},
    {"actor_id": "bebity/linkedin-jobs-scraper", "input": {"maxJobs": 50}},
]

estimate = estimate_project_cost(tasks)
print(f"Estimated cost: ${estimate['total_cost']:.2f}")
print(f"Estimated time: {estimate['total_time_minutes']} minutes")
```

---

## SEMrush

**Purpose:** SEO analysis, keyword research, backlinks

**Keys:** 4 keys, 5.7M+ credits  
**Auto-rotation:** ✅ On rate limits

### Basic Usage

```python
from tools.semrush import SEMrushClient

# Initialize
client = SEMrushClient()

# Check credits
credits = client.check_credits()
print(f"Credits remaining: {credits.credits_remaining:,}")

# Get domain authority
ranks = client.get_domain_ranks("competitor.com", database="us")
print(f"Domain rank: {ranks.data['rank']}")

# Get organic keywords
keywords = client.get_organic_keywords(
    domain="competitor.com",
    database="us",
    display_limit=100
)

for kw in keywords.data:
    print(f"{kw['keyword']}: {kw['position']}")
```

### Advanced Usage

```python
# Get backlinks
backlinks = client.get_backlinks_overview("competitor.com")
print(f"Total backlinks: {backlinks.data['backlinks_num']}")

# Get competitors
competitors = client.get_competitors("yoursite.com", database="us")
for comp in competitors.data:
    print(f"{comp['domain']}: {comp['common_keywords']} common keywords")

# Keyword research
keyword_data = client.get_keyword_overview(
    keyword="ai customer service",
    database="us"
)
print(f"Search volume: {keyword_data.data['search_volume']}")
print(f"CPC: ${keyword_data.data['cpc']}")
```

### Cost Estimation

- Domain ranks: ~10 credits
- Organic keywords: ~40 credits per 100 keywords
- Backlinks: ~40 credits
- Keyword overview: ~10 credits per keyword

---

## Exa

**Purpose:** Semantic company search, lookalikes, industry discovery

**Key:** 1 active key  
**Neural search:** ✅ Semantic understanding

### Basic Usage

```python
from tools.exa import find_similar_companies, search_companies

# Find companies similar to a URL
results = find_similar_companies(
    url="https://zendesk.com",
    num_results=25
)

for company in results['results']:
    print(f"{company['title']}: {company['url']}")

# Semantic search
results = search_companies(
    query="B2B SaaS companies in healthcare with customer support needs",
    num_results=50
)
```

### Lookalike Lead Generation

```python
from tools.exa import find_lookalikes_for_customers

# Find lookalikes for your best customers
data = find_lookalikes_for_customers(
    customers=["mastermind", "k1x", "clickup"],
    results_per_customer=20
)

print(f"Found {data['total_unique']} unique companies")

# Export to CSV/JSON
from tools.exa import export_leads
export_leads(data, filename="lookalike_leads")
```

### Industry Search

```python
from tools.exa import find_companies_by_industry

# Find companies in specific industry
results = find_companies_by_industry(
    industry="FinTech",
    description="B2B payment processing with high transaction volume",
    num_results=100
)

print(f"Found {results['total']} FinTech companies")
```

---

## Perplexity

**Purpose:** AI-powered research, reasoning, chat

**Key:** 1 active key  
**Models:** sonar, sonar-pro, sonar-reasoning

### Basic Usage

```python
from tools.perplexity import PerplexityClient

# Initialize
client = PerplexityClient()

# Research mode (with citations)
response = client.research(
    query="What are the latest trends in AI customer service for 2026?",
    model="sonar-pro"
)

print(response['content'])
print(f"Citations: {response['citations']}")

# Chat mode
response = client.chat(
    messages=[
        {"role": "user", "content": "Explain AI agents vs chatbots"}
    ],
    model="sonar"
)

print(response['content'])
```

### Advanced Usage

```python
# Reasoning mode (deep analysis)
response = client.reason(
    query="Should we build or buy our customer service AI solution?",
    context={
        "team_size": 5,
        "budget": "$100k",
        "timeline": "6 months"
    }
)

print(response['reasoning'])
print(response['recommendation'])
```

---

## Serper

**Purpose:** Google SERP API (search results without scraping)

**Key:** 1 active key  
**Cost:** $1/1k queries

### Basic Usage

```python
from tools.serper import SerperClient

# Initialize
client = SerperClient()

# Search Google
results = client.search(
    query="ai customer service software",
    num_results=10
)

for result in results['organic']:
    print(f"{result['title']}: {result['link']}")

# Get People Also Ask
paa = client.get_people_also_ask("ai customer service")
for question in paa:
    print(f"Q: {question}")
```

### Advanced Usage

```python
# News search
news = client.search_news(
    query="AI customer service",
    num_results=20
)

# Image search
images = client.search_images(
    query="customer service dashboard",
    num_results=50
)

# Location-based search
local = client.search(
    query="customer service software",
    location="San Francisco, CA"
)
```

---

## Other Tools

### Grammarly (Content QA)

```python
from tools.grammarly import GrammarlyClient

client = GrammarlyClient()

# Check grammar
result = client.check_text("Your content here...")
print(f"Score: {result['score']}")
print(f"Issues: {len(result['issues'])}")
```

### Mistral (AI Content)

```python
from tools.mistral import MistralClient

client = MistralClient()

# Generate content
response = client.generate(
    prompt="Write a blog post about AI customer service",
    model="mistral-large"
)
```

### Cohere (Competitive Analysis)

```python
from tools.cohere import CohereClient

client = CohereClient()

# Analyze text
analysis = client.analyze(
    text="Competitor product description...",
    task="sentiment"
)
```

---

## Cost Summary

| Tool | Credits | Cost per Call | Best For |
|------|---------|---------------|----------|
| Firecrawl | 1.4M+ | $0.01-0.05/page | Website crawling |
| Apify | Varies | $0.10-0.50/task | Pre-built scrapers |
| SEMrush | 5.7M+ | 10-40 credits | SEO analysis |
| Exa | Active | $0.01-0.05/search | Company discovery |
| Perplexity | Active | $0.01-0.10/query | AI research |
| Serper | Active | $0.001/query | Google SERP |

---

## Key Rotation

All tools with multiple keys use automatic rotation:

1. **Credit-aware selection** — Prioritizes keys with more credits
2. **Automatic failover** — Switches on 402/429 errors
3. **Load balancing** — Distributes requests evenly
4. **Usage tracking** — Monitors consumption per key

Check key health:
```bash
python tools/verify_keys.py
```

---

## Next Steps

- See `WORKFLOWS.md` for Interview-First + Ralph Loop patterns
- See `KEY_ROTATION.md` for key management best practices
- Check tool-specific READMEs in `tools/[tool]/README.md`

---

**For detailed API documentation, see each tool's official docs:**
- Firecrawl: https://docs.firecrawl.dev
- Apify: https://docs.apify.com
- SEMrush: https://developer.semrush.com
- Exa: https://docs.exa.ai
- Perplexity: https://docs.perplexity.ai
