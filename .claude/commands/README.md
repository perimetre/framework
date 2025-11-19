# Claude Code Commands

This directory contains custom slash commands for Claude Code.

## Available Commands

### `/perimetre-code-review`

Performs a comprehensive code review of recent changes using Perimetre framework patterns.

**Usage:**

```
/perimetre-code-review
```

**What it does:**

1. **Dynamically discovers and fetches** relevant framework documentation based on your changes
2. **Examines git changes** to understand what was modified
3. **Cross-references** changes with framework patterns from LLMs documentation
4. **Compares** to working examples when applicable
5. **Flags issues** with evidence from documentation
6. **Provides fixes** with code examples and rationale

**Key Features:**

- ✅ Prevents CI failures (TypeScript, ESLint, build errors)
- ✅ Enforces mandatory patterns (error-as-values, service layer, Zod validation)
- ✅ Evidence-based reviews (cites documentation when flagging issues)
- ✅ Context-aware (only fetches relevant docs based on your changes)
- ✅ Actionable feedback (every issue includes fix with code example)

**Review Process:**

The command follows an explicit 11-step process:

1. Examine git changes (`git status`, `git diff`)
2. Discover available docs (`gh api repos/perimetre/framework/contents/LLMs --jq '.[].name'`)
3. Fetch relevant docs based on changed files
4. Check for relevant examples
5. Proceed with review using fetched context
6. Triage by risk level
7. Cross-reference with documentation
8. Enforce patterns with evidence
9. Compare to examples
10. Quick sanity checks
11. Code quality review

**Output Format:**

```markdown
## 🔴 CRITICAL Issues

[Issues that must be fixed before merge]

## 🟡 HIGH Priority

[Should fix before merge]

## 🟢 MEDIUM / Suggestions

[Nice to have]

## ✅ Positive Feedback

[What was done well]

## Summary

**Recommendation:** [APPROVE / REQUEST CHANGES]
**Critical:** [count]
**High:** [count]
```

**Example:**

```bash
# Make some changes
git add .
git commit -m "feat: add user service"

# Run code review
/perimetre-code-review
```

Claude will:

- Examine your changes
- Fetch relevant docs (services.md, error-handling-exception.md, etc.)
- Review your code against framework patterns
- Provide evidence-based feedback with fixes

## Command vs Skill

**Command** (`/perimetre-code-review`):

- **User-invoked** - You manually type the command
- Use when you want explicit control over when review happens

**Skill** (`code-review`):

- **Model-invoked** - Claude automatically activates when appropriate
- Triggers on keywords like "review", "code review", "check code"
- Same functionality as command, different activation

Both use identical review logic and produce the same output.

## Sharing with Team

These commands are in the framework repo, so:

**For framework contributors:**

- Commands automatically available in this repo

**For other project repos:**

Option 1: Copy to project (recommended):

```bash
cd your-project
mkdir -p .claude/commands
cp /path/to/framework/.claude/commands/perimetre-code-review.md .claude/commands/
git add .claude/commands
git commit -m "chore: add code review command"
```

Option 2: Symlink (stays in sync):

```bash
cd your-project
mkdir -p .claude/commands
ln -s /path/to/framework/.claude/commands/perimetre-code-review.md .claude/commands/perimetre-code-review.md
```

Option 3: Personal command (works across all projects):

```bash
cp .claude/commands/perimetre-code-review.md ~/.claude/commands/
```

## Documentation

For more details on the review process and patterns, see:

- `../skills/code-review/SKILL.md` - Full skill documentation
- `../skills/code-review/README.md` - Usage guide
- `../../analysis/CODE_REVIEW_PATTERNS.md` - Common issues from 141 reviews
- `../../LLMs/` - Framework pattern documentation
