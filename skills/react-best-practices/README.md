# React Best Practices Skill

**Source:** [Vercel Labs Agent Skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)  
**Version:** 1.0.0  
**Last Updated:** January 2026

## Overview

Comprehensive performance optimization guide for React and Next.js applications, designed for AI agents and developers. Contains **40+ rules across 8 categories**, prioritized by impact from CRITICAL to LOW.

## Categories

### 1. **Eliminating Waterfalls** (CRITICAL)
- Defer await until needed
- Dependency-based parallelization
- Prevent waterfall chains in API routes
- Promise.all() for independent operations
- Strategic Suspense boundaries

### 2. **Bundle Size Optimization** (CRITICAL)
- Avoid barrel file imports
- Conditional module loading
- Defer non-critical third-party libraries
- Dynamic imports for heavy components
- Preload based on user intent

### 3. **Server-Side Performance** (HIGH)
- Authenticate Server Actions
- Avoid duplicate serialization in RSC props
- Cross-request LRU caching
- Minimize serialization at RSC boundaries
- Parallel data fetching with component composition
- Per-request deduplication with React.cache()
- Use after() for non-blocking operations

### 4. **Client-Side Data Fetching** (MEDIUM-HIGH)
- Deduplicate global event listeners
- Use passive event listeners for scrolling
- Use SWR for automatic deduplication
- Version and minimize localStorage data

### 5. **Re-render Optimization** (MEDIUM)
- Defer state reads to usage point
- Extract to memoized components
- Narrow effect dependencies
- Use lazy state initialization
- Use transitions for non-urgent updates

### 6. **Rendering Performance** (MEDIUM)
- CSS content-visibility for long lists
- Hoist static JSX elements
- Prevent hydration mismatch without flickering
- Use explicit conditional rendering

### 7. **JavaScript Performance** (LOW-MEDIUM)
- Combine multiple array iterations
- Use Set/Map for O(1) lookups
- Cache repeated function calls
- Early return from functions

### 8. **Advanced Patterns** (LOW)
- Store event handlers in refs
- useEffectEvent for stable callback refs

## When to Use This Skill

Apply these patterns when:
- Building React or Next.js applications
- Optimizing existing React codebases
- Reviewing code for performance issues
- Refactoring components for better performance
- Setting up new projects with best practices

## Key Principles

1. **Eliminate waterfalls first** - Biggest performance gains
2. **Reduce bundle size** - Faster initial load
3. **Optimize server-side** - Better TTFB and SSR performance
4. **Minimize re-renders** - Smoother user experience
5. **Profile before optimizing** - Focus on actual bottlenecks

## Integration with Other Skills

This skill complements:
- **Frontend Design Skill** - Technical performance + visual excellence
- **Research Tools** - Build performant dashboards for data visualization
- **API Integration** - Optimize data fetching patterns

## Full Documentation

See `AGENTS.md` for complete implementation details, code examples, and impact metrics for all 40+ rules.
