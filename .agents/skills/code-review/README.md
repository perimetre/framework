# Code Review Skill

A Claude Code skill that performs comprehensive, pragmatic code reviews for Next.js/React projects using Perimetre framework patterns.

## What is This?

This is a **skill** (not a command) - meaning Claude will automatically activate it when it detects code review scenarios. You don't need to manually invoke it.

## When Does It Activate?

Claude will use this skill when:

- Reviewing pull requests
- Checking code quality
- Analyzing git diffs
- User requests code review
- Reviewing recent changes

The skill is triggered by keywords like: "code review", "review pull request", "check code", "analyze changes", etc.

## What Does It Do?

The skill performs a thorough code review focused on:

1. **Dynamically fetches relevant documentation** - Uses `gh api` to discover and fetch only the docs relevant to your changes:

   ```bash
   # Discovers available documentation
   gh api repos/perimetre/framework/contents/LLMs --jq '.[].name'

   # Fetches relevant docs based on changed files
   https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/services.md
   ```

2. **Preventing CI failures** - Catches TypeScript errors, ESLint issues, build failures before they happen

3. **Enforcing mandatory patterns** (based on fetched docs):
   - Error-as-values pattern (Go/Rust-like error handling)
   - Service layer architecture with `@perimetre/service-builder`
   - Zod validation for forms (React Hook Form)
   - Proper icon usage with `@perimetre/icons`
   - Correct Next.js Image component usage

4. **Maintaining code quality**:
   - Security (input validation, no hardcoded secrets)
   - Performance (parallel operations, image optimization)
   - Accessibility (alt text, aria labels)
   - Code smells (DRY, SOLID principles)
   - TypeScript best practices (avoid `as`, prefer inference)

## How to Use

### Manual Invocation

You can explicitly ask Claude to review code:

```
Review the recent changes in this PR
```

```
Can you do a code review of the files I just changed?
```

```
Review my implementation of the new feature
```

### Automatic Activation

Claude will automatically use this skill when it detects you're working on code review tasks.

## Review Format

The skill provides structured feedback:

- **🔴 CRITICAL Issues** - Must fix before merge (CI failures, security, violations)
- **🟡 HIGH Priority** - Should fix before merge (common issues, performance)
- **🟢 MEDIUM Priority** - Nice to have improvements
- **✅ Positive Feedback** - What was done well

Each issue includes:

- File path and line number
- Explanation of the problem
- Current problematic code
- Fixed code example
- Rationale (why it matters)
- Reference documentation

## Based On

This skill is based on:

- Analysis of 141 actual code reviews across 56 pull requests
- Perimetre framework architectural patterns (LLMs directory)
- Working examples in framework repo (examples/trpc, examples/tanstack-query-and-graphql)
- Anthropic's code review best practices

## Review Process

The skill follows an **explicit step-by-step process**:

1. **Examine git changes** (`git status`, `git diff`)
2. **Discover available documentation** (`gh api repos/perimetre/framework/contents/LLMs --jq '.[].name'`)
3. **Fetch relevant docs** based on changed files (services → services.md, forms → react-hook-form.md, etc.)
4. **Check for relevant examples** (`gh api repos/perimetre/framework/contents/examples --jq '.[].name'`)
5. **Cross-reference** changes with fetched documentation
6. **Compare** to examples when applicable
7. **Flag issues** with evidence from docs
8. **Provide fixes** with code examples and rationale

This ensures reviews are:

- **Context-aware** - Only fetches docs relevant to your changes
- **Evidence-based** - Cites specific documentation when flagging issues
- **Consistent** - Always uses latest patterns from framework
- **Efficient** - Doesn't waste tokens on irrelevant documentation

## Key Differences from Generic Reviews

Unlike generic code review tools, this skill:

- **Dynamically fetches context** - Only loads documentation relevant to your specific changes
- **Understands your architecture** - Knows about service layer, error-as-values pattern
- **Prevents CI failures** - Simulates your actual CI checks (lint, typecheck, build)
- **Framework-aware** - Enforces Perimetre-specific patterns
- **Pragmatic** - Focuses on high-impact issues, avoids nitpicks
- **Educational** - Explains _why_, not just _what_
- **Evidence-based** - Cites documentation when flagging issues

## Tool Restrictions

This skill is restricted to read-only operations:

- **Read** - View file contents
- **Grep** - Search for patterns in code
- **Glob** - Find files by pattern
- **Bash** - Run git commands to check diffs

It cannot modify files directly - that's by design to keep reviews safe.

## Reference Documentation

The skill references these authoritative sources:

**Framework Patterns:**

- [Error Handling](https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/error-handling-exception.md)
- [Service Layer](https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/services.md)
- [tRPC](https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/trpc.md)
- [Forms](https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/react-hook-form.md)
- [GraphQL](https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/graphql.md)
- [Icons](https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/icons.md)
- [Images](https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/image-component.md)

**Examples:**

- [tRPC Example](https://github.com/perimetre/framework/tree/main/examples/trpc)
- [GraphQL Example](https://github.com/perimetre/framework/tree/main/examples/tanstack-query-and-graphql)

## Sharing with Team

This skill is in the framework repo, so:

**For framework contributors:**

- It's automatically available when working in this repo

**For other project repos:**

Option 1: Copy to project (recommended for customization):

```bash
mkdir -p .claude/skills
cp -r /path/to/framework/.claude/skills/code-review .claude/skills/
```

Option 2: Symlink (stays in sync with framework):

```bash
mkdir -p .claude/skills
ln -s /path/to/framework/.claude/skills/code-review .claude/skills/code-review
```

Option 3: Install as personal skill (works across all projects):

```bash
cp -r .claude/skills/code-review ~/.claude/skills/
```

## Updating the Skill

As patterns evolve, update `SKILL.md`:

1. Add new mandatory patterns as needed
2. Update examples with real code from projects
3. Adjust priorities based on review frequency
4. Keep references to external docs current

## Feedback

If you find the skill:

- Missing important patterns → Add them to `SKILL.md`
- Too strict on certain issues → Adjust severity or add to "when to skip"
- Not activating when expected → Add trigger keywords to description
