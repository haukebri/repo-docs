# Code Review Command

## Purpose

Perform fast, parallel code review using Task agents to ensure quality, alignment with requirements, and adherence to KISS principles.

## Execution

Launch these Task agents in parallel for comprehensive review:

### Agent 1: Requirements Analyst

**Focus**: Task verification and scope assessment

- Review the original task/bug description
- Check all modified files with `git diff`
- Verify implementation matches exact requirements
- Flag any scope creep or unnecessary additions
- Ensure no files were modified outside task scope

### Agent 2: Business Alignment Checker

**Focus**: Client briefing and UX compliance

- Read `/docs/*`
- Verify UX flow is preserved
- Check business logic and calculations
- Ensure user experience matches expectations
- Review any UI changes for consistency

### Agent 3: Code Quality Inspector

**Focus**: Technical excellence and KISS principles

- Evaluate code simplicity and readability
- Check for over-engineering
- Verify coding standards (WordPress/PHP/JS)
- Look for obvious bugs or edge cases
- Assess if solution could be simpler

### Agent 4: Testing & Integration Validator

**Focus**: Tests and system integration

- Check if tests were added/updated
- Run `npm run lint`
- Verify database migrations if needed
- Check for version bumps in files
- Ensure no breaking changes

## Synthesis

After all agents complete, synthesize findings into a verdict:

### ✅ PASSED

**Summary from all agents:**

- ✓ Requirements: [Agent 1 findings]
- ✓ Business: [Agent 2 findings]
- ✓ Code Quality: [Agent 3 findings]
- ✓ Integration: [Agent 4 findings]

**Commit message:**

```
[type]: [concise description]

- [Key change from implementation]
- [Impact/benefit]
```

### ❌ NEEDS REVISION

**Issues identified by agents:**

- Agent 1: [Requirement mismatches]
- Agent 2: [Business logic concerns]
- Agent 3: [Code quality issues]
- Agent 4: [Test/integration problems]

**Priority fixes:**

1. [Most critical issue]
2. [Second priority]
3. [Additional concerns]

**Files to modify:** [List from agents]
