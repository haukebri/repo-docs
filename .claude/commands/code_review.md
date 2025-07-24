# 🔍 Code Review – KISS & Scope-First

## 🎯 Purpose

Quickly evaluate a change to catch **scope creep**, ensure **task alignment**, and uphold the **KISS principle**. Keep it tight. Keep it simple.

---

## ✅ Review Steps

### 1. 📌 Scope Check (Task Compliance)

- Read the task, ticket, or bug description.
- Run `git diff --stat` and `git diff`:
  - Are all changes **within expected files**?
  - Any **unrelated refactors, formatting, or extras**? Flag them.
- If files outside the task scope are modified, document why.

> ❗ Focus on: **Unnecessary additions**, **scope drift**, and **unrequested extras**

---

### 2. 🧠 Simplicity Check (KISS Compliance)

- Review the implementation for clarity.
- Ask: **Could this be done in a simpler or clearer way?**
- Flag:
  - Overuse of abstraction
  - Redundant logic
  - Fancy solutions to simple problems

> ❗ If it's not the simplest thing that works — call it out.

---

### 3. 🧪 Smoke Test (Optional, If Critical Logic Changed)

- Check if any test was added or updated.
- If no tests and the change affects visible logic, run a quick **Playwright test manually**:
  - Store all **screenshots inside the project folder:** `./test-artifacts/screenshots/`
  - **Do not** save screenshots to `~/Downloads` or external paths

> This is not a full regression — just ensure no obvious breakage.

---

## 🟢 Pass Criteria

- All changes align with the **original task**
- Code is **clear, simple, and maintainable**
- No unrelated edits

---

## ❌ Fail If

- Scope creep is detected
- The solution is overengineered
- There are any unjustified unrelated changes

---

## ✅ Output Format (Use placeholders only)

🎯 Task Scope: <clean / off-scope changes found>  
🧠 Simplicity: <simple / overengineered>  
🧪 Smoke Check: <not needed / done / missing>  

🟢 Verdict: <OK / OK with comment / Needs revision>  

💬 Notes: <insert summary or actionable comments here>
