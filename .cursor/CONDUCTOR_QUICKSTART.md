# Conductor Quickstart — Copy-Paste Prompts

Invoke each agent by typing in Cursor chat. Use `@` to reference the rule.

---

## Full flow (new feature)

### One-shot (auto router)

```
@auto Ship: [feature name]. Context: [1–2 sentences]. Must-haves: [P0 bullets]. Constraints: [ship tonight / no new deps / etc.]
```

---

### Manual flow (step-by-step)

```
@spec Add [feature name]: [1–2 sentence description]
```

```
@design
```

```
@architect
```

```
@python Implement [pipeline/data scope]
```

```
@integration
```

```
@frontend Build [page/component scope]
```

```
@seo
```

```
@data
```

```
@review
```

```
@deploy
```

---

## Single-agent (targeted work)

| Task | Prompt |
|------|--------|
| One-shot ship | `@auto Ship: [feature] ...` |
| Write a spec | `@spec [description]` |
| SEO plan + metadata/indexing | `@seo` |
| Design system | `@architect` |
| Build pipeline | `@python [scope]` |
| Build UI | `@frontend [scope]` |
| Wire APIs | `@integration` |
| Review & fix | `@review` |
| Deploy config | `@deploy` |

---

## Example: Player comparison feature

1. `@spec Add player comparison: head-to-head stats, match history, level diff`
2. `@architect`
3. `@python Implement comparison data pipeline from existing player/match data`
4. `@frontend Build comparison page at /compare with player cards and stats`
5. `@integration`
6. `@review`
7. `@deploy`
