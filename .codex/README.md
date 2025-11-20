# Perimetre Framework - Codex Integration

Custom Codex slash commands for Perimetre framework projects.

## Available Commands

### `/prompts:perimetre-code-review`

Comprehensive code review following Perimetre framework patterns with multi-agent methodology.

**Features:**

- Dynamic documentation fetching based on changed files
- Multi-perspective review (5 independent checks)
- Confidence scoring (only reports issues ≥ 80)
- Production-validated patterns from 141+ reviews
- Evidence-based feedback with documentation citations

**Usage:**

```bash
# Review current changes
/prompts:perimetre-code-review

# Review specific files
/prompts:perimetre-code-review FILES="src/server/services/posts.ts"

# Review pull request
/prompts:perimetre-code-review PR_NUMBER=123
```

## Installation

### Option 1: Global Installation (Recommended)

Install for all projects:

```bash
# Create Codex prompts directory
mkdir -p ~/.codex/prompts

# Copy the code review command
cp .codex/prompts/perimetre-code-review.md ~/.codex/prompts/

# Restart Codex or start new chat
# The command will be available as /prompts:perimetre-code-review
```

### Option 2: Project-Specific Installation

Install for a specific project:

```bash
cd your-project

# Create local Codex prompts directory
mkdir -p .codex/prompts

# Copy from framework repo
cp /path/to/framework/.codex/prompts/perimetre-code-review.md .codex/prompts/

# Commit to version control (optional)
git add .codex
git commit -m "chore: add Perimetre code review command"
```

### Option 3: Symlink (Stays in Sync)

Create a symlink to always use the latest version:

```bash
# Global
mkdir -p ~/.codex/prompts
ln -s /path/to/framework/.codex/prompts/perimetre-code-review.md ~/.codex/prompts/

# Project-specific
mkdir -p .codex/prompts
ln -s /path/to/framework/.codex/prompts/perimetre-code-review.md .codex/prompts/
```

## How It Works

### 7-Step Review Process

1. **Discover Documentation** - Lists available LLM pattern docs
2. **Examine Changes** - Analyzes git diff and maps to patterns
3. **Fetch Relevant Docs** - Downloads only relevant pattern documentation
4. **Multi-Perspective Review** - 5 independent review perspectives:
   - Framework pattern compliance
   - Shallow bug scan
   - Historical context
   - Previous PR patterns
   - Code comment compliance
5. **Confidence Scoring** - Scores each issue 0-100
6. **Filter Issues** - Only reports confidence ≥ 80
7. **Format Output** - Structured review with evidence and fixes

### What Gets Checked

**Critical Patterns:**

- Error-as-values pattern (`ok: true` vs Error instances)
- Service layer architecture (business logic in services)
- Single shared Zod schema (client + server)
- Icons with @perimetre/icons (currentColor, accessibility)
- Next.js Image component (fill, priority, i18n)
- Internationalization (all text translated)
- TypeScript best practices (inference, readonly, no `any`)
- State management (nuqs for URL state)

**Common Issues (Top 10 from 141 reviews):**

1. Fixed heights on responsive components
2. Using `<a>` instead of `<Link>`
3. Prop drilling when hooks available
4. CSS in globals.css instead of components
5. Server/client component boundaries
6. Image component misuse
7. Code duplication
8. Hardcoded text (i18n violations)
9. Type casting without validation
10. Verbose React.ComponentProps types

## Documentation Reference

The command automatically fetches relevant documentation:

**PATTERNS.md (981 lines):**

```bash
https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/.claude/skills/code-review/PATTERNS.md
```

**LLM Pattern Docs:**

- Error Handling: `error-handling-exception.md`
- Service Layer: `services.md`
- Forms: `react-hook-form.md`
- Icons: `icons.md`
- Images: `image-component.md`
- GraphQL: `graphql.md`
- TanStack Query: `tanstack-query.md`
- tRPC: `trpc.md`

**Working Examples:**

- tRPC: `/examples/trpc/`
- GraphQL: `/examples/tanstack-query-and-graphql/`

## Output Format

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

**Reference:** https://raw.githubusercontent.com/...

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

## Updating

After updating the command file:

1. **If using global install:** Restart Codex or start a new chat
2. **If using symlink:** Changes take effect on next Codex restart
3. **If using project copy:** Re-copy the file from framework repo

## Troubleshooting

### Command Not Appearing

1. Verify file location: `~/.codex/prompts/perimetre-code-review.md`
2. Check file is not in a subdirectory (Codex only scans top-level)
3. Restart Codex or start a new chat
4. Type `/prompts:` to see all available commands

### Missing Documentation

If documentation fetch fails:

```bash
# Verify network access
curl -sL "https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/services.md"

# Check repository access (private repo requires authentication)
gh auth status
gh auth login
````

### Too Many False Positives

The confidence threshold is set to 80. To adjust:

1. Edit the command file
2. Find: "Filter out any issues with confidence score **less than 80**"
3. Increase threshold to 85-90 for fewer issues
4. Decrease to 70-75 to catch more potential issues

## Contributing

To improve the code review command:

1. Update pattern documentation in `LLMs/`
2. Add new patterns to `PATTERNS.md`
3. Update the command file in `.codex/prompts/`
4. Submit PR to framework repo

## Support

- **Framework docs:** `/LLMs/`
- **Examples:** `/examples/`
- **Issues:** Create issue in framework repo
- **Questions:** Ask in team chat
