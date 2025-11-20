Provide a comprehensive code review for the recent changes.

To do this, follow these steps **precisely**:

## Step 1: Discover Framework Documentation

Use a Haiku agent to:

1. Run `gh api repos/perimetre/framework/contents/LLMs --jq '.[].name'` to list available documentation
2. Run `gh api repos/perimetre/framework/contents/examples --jq '.[].name'` to list available examples
3. Return the complete list of available docs and examples

## Step 2: Examine Changes

Use a Haiku agent to:

1. Run `git status` to see changed files
2. Run `git diff` to see the actual changes
3. Run `git log --oneline -5` to see recent commits
4. Return a summary of:
   - Which files changed
   - What patterns they involve (services, forms, icons, etc.)
   - Which LLM docs are relevant (based on mapping below)

**Documentation Mapping:**

| If changes involve                   | Fetch these docs                                        |
| ------------------------------------ | ------------------------------------------------------- |
| Services, routers, API routes        | `services.md`, `error-handling-exception.md`, `trpc.md` |
| Forms, validation, user input        | `react-hook-form.md`, `error-handling-exception.md`     |
| Icons, SVGs, icon components         | `icons.md`                                              |
| Images, Next.js Image component      | `image-component.md`                                    |
| GraphQL queries/mutations            | `graphql.md`, `tanstack-query.md`                       |
| TanStack Query (non-GraphQL)         | `tanstack-query.md`, `error-handling-exception.md`      |
| tRPC implementation                  | `trpc.md`, `services.md`, `error-handling-exception.md` |
| Error handling, try-catch blocks     | `error-handling-exception.md`, `services.md`            |
| User-facing text (hardcoded strings) | `react-hook-form.md` (i18n patterns)                    |

## Step 3: Fetch Relevant Documentation

Use a Haiku agent to fetch the relevant LLM documentation files (from step 2) using WebFetch:

- Fetch from: `https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/{filename.md}`
- Extract all patterns, rules, and examples
- Return concise summary of key rules to check

## Step 4: Independent Code Review by Multiple Agents

Launch **5 parallel Sonnet agents** to independently review the changes. Each agent should return a list of issues and the reason each issue was flagged:

**Agent #1: Framework Pattern Compliance**

- Fetch and read the relevant LLM documentation (from step 3)
- Audit changes for compliance with framework patterns
- Check for:
  - Error-as-values pattern violations
  - Service layer violations (business logic in routes)
  - Single shared Zod schema usage
  - Icon/Image component patterns
  - Internationalization (all text translated)
  - Any other pattern from fetched docs
- Note: Focus on patterns explicitly documented, not general best practices

**Agent #2: Shallow Bug Scan**

- Read ONLY the file changes (git diff)
- Scan for obvious bugs in the changed code
- Focus on large bugs only
- Avoid nitpicks and likely false positives
- Ignore issues that linters/typecheck would catch

**Agent #3: Historical Context Review**

- Read git blame and history of modified code
- Identify bugs in light of historical context
- Check for regressions or breaking changes
- Look for patterns in how this code evolved

**Agent #4: Previous PR Comments**

- Find previous pull requests that touched these files
- Read comments on those PRs
- Check if any previous feedback applies to current changes
- Look for repeated issues or patterns

**Agent #5: Code Comments Compliance**

- Read code comments in modified files
- Check if changes comply with guidance in comments
- Look for `// TODO`, `// !`, `// ?` comments
- Verify changes don't violate documented constraints

## Step 5: Confidence Scoring

For each issue found in step 4, launch a **parallel Haiku agent** that:

- Takes the issue description and fetched documentation
- Returns a confidence score (0-100) using this rubric (give this rubric **verbatim** to the agent):
  - **0**: Not confident at all. This is a false positive that doesn't stand up to light scrutiny, or is a pre-existing issue.
  - **25**: Somewhat confident. This might be a real issue, but may also be a false positive. The agent wasn't able to verify that it's a real issue. If the issue is stylistic, it is one that was not explicitly called out in the relevant documentation.
  - **50**: Moderately confident. The agent was able to verify this is a real issue, but it might be a nitpick or not happen very often in practice. Relative to the rest of the changes, it's not very important.
  - **75**: Highly confident. The agent double checked the issue, and verified that it is very likely it is a real issue that will be hit in practice. The existing approach is insufficient. The issue is very important and will directly impact the code's functionality, or it is an issue that is directly mentioned in the relevant documentation.
  - **100**: Absolutely certain. The agent double checked the issue, and confirmed that it is definitely a real issue, that will happen frequently in practice. The evidence directly confirms this.
- For documentation-based issues: Double-check the fetched docs actually call out this specific issue
- Return: score + brief justification

## Step 6: Filter Issues

Filter out any issues with confidence score **less than 80**.

If no issues remain after filtering, provide brief positive feedback and stop.

## Step 7: Format Review Output

Structure the final review as follows:

````markdown
### Code Review

Found [N] issues:

1. **[Brief issue description]** (Confidence: [score])

**Evidence:** According to `[doc-name.md]`:

> [Quote from documentation]

**File:** `[path/to/file.ts:lines]`

**Current:**

```[lang]
[problematic code]
```

**Fix:**

```[lang]
[corrected code]
```

**Why:** [Impact statement]

**Reference:** https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/[doc-name.md]

---

2. [Next issue...]

---

### Summary

**Recommendation:** [APPROVE / REQUEST CHANGES]

**Issues by severity:**

- Critical: [count]
- High: [count]
- Medium: [count]

**Next steps:**

1. [Action item]
2. [Action item]
````

**Output Requirements:**

- Keep output concise and actionable
- Cite and link specific documentation
- Provide code examples for every issue
- Include confidence scores
- Avoid emojis

**If no issues found:**

```markdown
### Code Review

No issues found. Checked for:

- Framework pattern compliance ([list patterns checked])
- Obvious bugs
- Historical context issues
- Code comment compliance

**Recommendation:** APPROVE
```

---

## Examples of False Positives (DO NOT FLAG)

- Pre-existing issues (not introduced in this PR)
- Something that looks like a bug but is not
- Pedantic nitpicks that a senior engineer wouldn't call out
- Issues that linters/typecheckers/compilers would catch (missing imports, type errors, formatting)
- General code quality issues (test coverage, docs) unless explicitly required in framework docs
- Issues called out in docs but explicitly silenced in code (lint ignore comments)
- Intentional functionality changes related to the broader change
- Real issues, but on lines the user did not modify

---

## Mandatory Patterns to Check

**From Framework Documentation (agents will fetch these):**

### 1. Error-as-Values Pattern

- ✅ Success uses `ok: true as const`
- ❌ Never `ok: false`
- ✅ Failures return Error instances
- ✅ Check with `'ok' in result` (preferred)
- Reference: `error-handling-exception.md`

### 2. Service Layer

- ✅ Business logic in services
- ❌ Never in routes/controllers
- ✅ Routes delegate to services
- Reference: `services.md`

### 3. Single Shared Zod Schema

- ✅ One schema for client AND server in `form.ts`
- ❌ Never inline validation rules
- ❌ Never separate client/server schemas
- Reference: `react-hook-form.md`

### 4. Icons with @perimetre/icons

- ✅ Use Icon wrapper with `currentColor`
- ✅ `aria-hidden` or `label` at usage site
- ❌ Never in component declaration
- Reference: `icons.md`

### 5. Next.js Image Component

- ✅ Proper dimensions and sizes
- ❌ Never for SVG icons
- Reference: `image-component.md`

### 6. Internationalization

- ✅ All user-facing text translated with `t()`
- ✅ Schema errors, alt text, aria labels
- ❌ Never hardcoded English strings

### 7. TypeScript Quality

- ❌ No `any` (use `unknown`)
- ✅ Prefer `type` over `interface`
- ✅ Favor inference, use `readonly`, functions over classes

### 8. State Management

- ✅ Localized state preferred
- ✅ **nuqs** for URL state (https://nuqs.dev/)
- ✅ Context over Redux

### 9. TanStack Query / GraphQL

- ✅ Query factory pattern
- ✅ Run `pnpm codegen` after GraphQL changes
- Reference: `tanstack-query.md`, `graphql.md`

### 10. Common Issues (Top 10 from 141 reviews)

- ❌ Fixed heights on responsive components
- ❌ Using `<a>` instead of `<Link>`
- ❌ Prop drilling when hooks available
- ❌ CSS in globals vs components
- ❌ Code duplication

---

## Reference Documentation

**All LLM Documentation:**

Discover: `gh api repos/perimetre/framework/contents/LLMs --jq '.[].name'`

- Error Handling: https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/error-handling-exception.md
- Service Layer: https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/services.md
- tRPC: https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/trpc.md
- Forms: https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/react-hook-form.md
- GraphQL: https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/graphql.md
- TanStack Query: https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/tanstack-query.md
- Icons: https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/icons.md
- Images: https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/image-component.md

**Examples:**

- tRPC: https://github.com/perimetre/framework/tree/main/examples/trpc
- GraphQL: https://github.com/perimetre/framework/tree/main/examples/tanstack-query-and-graphql

**Detailed Pattern Reference:**

- All patterns with examples: `.claude/skills/code-review/PATTERNS.md`

---

## Important Notes

- **Always check for ESLINT and typescript build**
- **Use `gh` for GitHub interactions** rather than web fetch
- **Make a todo list first** to track progress
- **You must cite and link** each issue with documentation evidence
- **Use full git SHA** when linking to files
- **Provide context** when linking: Include 1 line before and after
