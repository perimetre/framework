# Code Review System - Usage Guide

## Overview

A multi-agent code review system for Perimetre framework projects, following Anthropic's best practices.

## Files

```
.claude/
├── skills/code-review/
│   ├── SKILL.md       (337 lines)  - Main skill definition with multi-agent workflow
│   ├── PATTERNS.md    (971 lines)  - Detailed pattern reference for agents
│   ├── README.md      (211 lines)  - Documentation and team guide
│   └── USAGE.md       (this file)  - Quick usage reference
└── commands/
    ├── perimetre-code-review.md (291 lines) - Manual command
    └── README.md      (143 lines)  - Command documentation
```

**Total:** 1,953 lines of comprehensive code review instructions

## How It Works

### Multi-Agent Workflow (7 Steps)

**Step 1:** Haiku agent discovers framework documentation

- Lists all LLM docs: `gh api repos/perimetre/framework/contents/LLMs --jq '.[].name'`
- Lists all examples: `gh api repos/perimetre/framework/contents/examples --jq '.[].name'`

**Step 2:** Haiku agent examines changes

- Runs `git status`, `git diff`, `git log`
- Maps changed files to relevant documentation

**Step 3:** Haiku agent fetches relevant docs

- Uses WebFetch to get only relevant LLM documentation
- Extracts patterns and rules to check

**Step 4:** 5 parallel Sonnet agents review independently

- **Agent #1:** Framework pattern compliance (fetches and checks against LLM docs)
- **Agent #2:** Shallow bug scan (obvious bugs only)
- **Agent #3:** Historical context (git blame, history)
- **Agent #4:** Previous PR comments (lessons learned)
- **Agent #5:** Code comments compliance (TODOs, warnings, constraints)

**Step 5:** Parallel Haiku agents score each issue

- Confidence scoring: 0-100 scale
- Double-checks documentation evidence
- Identifies false positives

**Step 6:** Filter issues

- Only report issues with confidence ≥ 80
- If no issues, provide brief positive feedback

**Step 7:** Format and output

- Structured review with evidence
- Code examples for fixes
- Documentation citations

## Usage

### Automatic (Skill)

Just ask:

```
"Review my recent changes"
"Can you review this?"
"Check my code"
```

The skill auto-activates on code review keywords.

### Manual (Command)

Explicitly invoke:

```
/perimetre-code-review
```

## What Gets Checked

### Mandatory Patterns (10)

1. ✅ **Error-as-values** - `ok: true as const` only for success
2. ✅ **Service layer** - Business logic in services
3. ✅ **Single shared Zod schema** - One schema for client AND server
4. ✅ **Icons** - @perimetre/icons with currentColor
5. ✅ **Images** - Next.js Image component properly
6. ✅ **Internationalization** - All text translated
7. ✅ **TypeScript** - No `any`, prefer `type`, inference, readonly
8. ✅ **State management** - nuqs for URL state
9. ✅ **TanStack Query/GraphQL** - Factory pattern
10. ✅ **Common issues** - Top 10 from historical reviews

### Quality Checks

- Security (input validation, no hardcoded secrets)
- Performance (parallel operations, useMemo usage)
- Accessibility (alt text, aria labels)
- Code smells (DRY, SOLID principles)
- False positive filtering (confidence ≥ 80)

## Output Format

### When Issues Found

````markdown
### Code Review

Found 3 issues:

1. **Service returns ok: false** (Confidence: 95)

**Evidence:** According to `error-handling-exception.md`:

> Success uses ok: true as const, failures return Error instances

**File:** `src/server/services/posts.ts:42`

**Current:**

```typescript
if (!post) return { ok: false, error: 'Not found' };
```
````

**Fix:**

```typescript
if (!post) return new NotFoundError();
```

**Why:** Breaks discriminated union pattern, prevents proper type narrowing

**Reference:** https://raw.githubusercontent.com/.../error-handling-exception.md

---

### Summary

**Recommendation:** REQUEST CHANGES

**Issues by severity:**

- Critical: 2
- High: 1
- Medium: 0

**Next steps:**

1. Fix error-as-values pattern in services
2. Review service layer documentation

````

### When No Issues

```markdown
### Code Review

No issues found. Checked for:
- Framework pattern compliance (error-as-values, service layer, forms)
- Obvious bugs
- Historical context issues
- Code comment compliance

**Recommendation:** APPROVE
````

## Key Features

### 1. Context-Aware

- Only fetches docs relevant to your changes
- Doesn't waste tokens on irrelevant patterns

### 2. Evidence-Based

- Cites specific documentation
- Quotes relevant sections
- Provides direct links

### 3. False Positive Filtering

- 5 independent reviewers
- Confidence scoring (0-100)
- Only reports if confidence ≥ 80

### 4. Multi-Agent Verification

- Pattern compliance agent
- Bug scan agent
- Historical context agent
- Previous PR comments agent
- Code comments agent

### 5. Actionable Feedback

- Every issue includes fix
- Code examples (current vs fix)
- Impact explanation
- Reference documentation

## Comparison to Generic Reviews

| Feature                  | Generic Review     | Perimetre Review             |
| ------------------------ | ------------------ | ---------------------------- |
| Context fetching         | Manual or all docs | Dynamic based on changes     |
| Pattern enforcement      | Generic rules      | Framework-specific patterns  |
| False positive filtering | None               | Confidence scoring ≥ 80      |
| Agent usage              | Single agent       | Multi-agent (Haiku + Sonnet) |
| Evidence                 | General knowledge  | Cites fetched documentation  |
| Historical data          | None               | Based on 141 real reviews    |

## Sharing with Team

### Copy to Project

```bash
cd your-project
mkdir -p .claude/{skills,commands}

# Copy skill
cp -r /path/to/framework/.claude/skills/code-review .claude/skills/

# Copy command
cp /path/to/framework/.claude/commands/perimetre-code-review.md .claude/commands/

# Commit
git add .claude
git commit -m "chore: add Perimetre code review system"
```

### Global Installation

```bash
# Skill (auto-activated across all projects)
cp -r /path/to/framework/.claude/skills/code-review ~/.claude/skills/

# Command (available in all projects)
cp /path/to/framework/.claude/commands/perimetre-code-review.md ~/.claude/commands/
```

## Customization

### Add Project-Specific Patterns

Edit `PATTERNS.md` to add:

- Project-specific rules
- Custom error classes
- Domain-specific validations
- Team conventions

### Adjust Confidence Threshold

In `SKILL.md` or command, change:

```markdown
Filter out any issues with confidence score **less than 80**.
```

Higher threshold (85-90) = fewer false positives, might miss some issues
Lower threshold (70-75) = more issues caught, more false positives

### Modify Agent Count

Default: 5 parallel Sonnet agents

Can adjust to:

- 3 agents for faster reviews (pattern compliance, bug scan, historical)
- 7 agents for more thorough reviews (add security, performance agents)

## Troubleshooting

### Issue: Skill not activating

**Solution:** Use explicit keywords:

- "Review my code"
- "Code review"
- "Check my changes"

Or use manual command: `/perimetre-code-review`

### Issue: Too many false positives

**Solution:**

- Increase confidence threshold to 85
- Review confidence scoring rubric
- Add patterns to "Examples of False Positives"

### Issue: Missing real issues

**Solution:**

- Decrease confidence threshold to 75
- Add pattern to `PATTERNS.md`
- Update documentation mapping table

## Tips for Best Results

1. **Make focused commits** - Easier to review small, focused changes
2. **Write descriptive commit messages** - Helps agents understand intent
3. **Add code comments** - Agents check compliance with comment guidance
4. **Use Better Comments** - `// !`, `// ?`, `// TODO` help agents
5. **Reference tickets** - Include ticket numbers in TODOs for context

## Feedback Loop

As you use the system:

1. **Track false positives** - Add to "Examples of False Positives"
2. **Track missed issues** - Add patterns to `PATTERNS.md`
3. **Refine confidence scoring** - Adjust threshold based on results
4. **Update documentation** - Keep LLMs docs current with new patterns

## Support

- **Framework docs:** `~/Developer/perimetre/framework/LLMs/`
- **Examples:** `~/Developer/perimetre/framework/examples/`
- **Historical data:** `~/Developer/perimetre/framework/analysis/`
- **Issues:** Create issue in framework repo
