# Prime Command - Calorie Form Plugin

## Purpose

Quickly orient Claude Code to the current project state, active sprint work, and essential context. This command uses parallel Task agents for efficient knowledge gathering.

## Execution

Use the Task tool to run these agents in parallel for faster priming:

### Agent 1: Sprint Status

- Read `/docs/milestones/overview.md` for project phases
- Check latest sprint planning docs in `/docs/sprints/`
- Identify current sprint number and active tasks
- Note any completed features from recent commits

### Agent 2: Architecture & Key Files

- Read `CLAUDE.md` for developer guidelines and known issues
- Scan `calorie-form.php` for version and constants
- Review `includes/CalorieForm.php` for core structure
- Check database schema version in submissions table

### Agent 3: Recent Changes

- Run `git log --oneline -n 10` to see recent commits
- Check `git status` for uncommitted changes
- Identify any in-progress features or branches

### Agent 4: Essential Context

- Read `/docs/business/client-briefing.txt` for business requirements
- Check for any recent bug reports in `/docs/tasks/`
- Note any sprint retrospective learnings from CLAUDE.md

## Output Format

After agents complete, synthesize findings into:

```
📊 Current Status:
- Sprint: [X] - [Name]
- Version: [X.X.X]
- Last commit: [message]

🎯 Active Tasks:
- [ ] Task X: [Description]
- [ ] Task Y: [Description]

⚠️ Important Notes:
- [Any critical issues or blockers]
- [Recent learnings or patterns to follow]

Ready to assist with sprint work!
```
