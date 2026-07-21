---
name: quick-pr-review
description: Use when reviewing a GitHub pull request, PR URL or number, especially when the user asks for a quick, lightweight, UI-focused, or merge-readiness code review.
---

# Quick PR Review

## Overview

Review the exact PR diff with effort proportional to risk. Report introduced defects; keep test gaps and polish separate from blockers.

## Review Mode

Use **quick mode** by default. Use **deep mode** only when the user explicitly requests it or the diff touches authentication, authorization, secrets, payments, database migrations, destructive operations, concurrency, or deployment infrastructure.

| Mode | Validation |
| --- | --- |
| Quick | PR metadata, full diff, `git diff --check`, focused tests when readily available |
| Deep | Quick checks plus risk-specific tests; build, browser checks, or parallel reviewers only when they test a concrete risk |

Treat UI/refactor PRs with at most 10 files and 400 changed lines as small unless high-risk code is present.

## Workflow

1. Resolve the repository, PR number, base SHA, and head SHA. Prefer the GitHub connector; use `git` or `gh` only for gaps.
2. Read the entire PR diff before testing. Compare against the PR base SHA, not a potentially stale local branch.
3. Check correctness, data exposure, accessibility, and framework boundaries affected by changed lines.
4. Validate proportionally:
   - Always run a whitespace/error check when local refs exist.
   - Run inexpensive focused tests for changed behavior.
   - Run provided typecheck or lint commands when relevant.
   - In quick mode, finish after this evidence is sufficient.
5. Report only introduced issues. Each finding needs a failure scenario, impact, file, and changed line.
6. Give the merge verdict immediately. If no blocking defect exists, say the PR is safe to merge.

## Finding Rules

- P0-P2: real runtime, security, data, build, or required-behavior defect. These may block merge.
- P3: low-impact but concrete defect. Usually non-blocking.
- Missing tests alone are non-blocking suggestions unless the PR explicitly requires coverage or the implementation is demonstrably wrong.
- Omit style preferences, speculative future regressions, and pre-existing problems.
- Do not mutate code, post GitHub comments, approve, or request changes unless the user explicitly asks.

## Quick-Mode Boundaries

The default review ends without dependency installation, worktrees, mutation testing, builds, browser automation, or subagents. Escalate only when a suspected defect cannot be verified more cheaply; state why first.

## Output Contract

Return, in order:

1. **Verdict:** merge, fix before merge, or unable to verify.
2. **Findings:** severity-first; write "none" when there are none.
3. **Non-blocking suggestions:** include only useful items.
4. **Evidence:** inspected SHA range and commands/checks run.

Keep quick-mode output concise. Do not bury the verdict under process narration.

## Example

User: `Review PR 6 quickly.`

Response shape:

```text
Verdict: safe to merge.
Blocking findings: none.
Suggestion: consider a direct test for the shared component.
Evidence: full base..head diff, diff --check, 12 focused tests passed.
```
