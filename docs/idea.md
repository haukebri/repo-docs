# Git-based editable Knowledge Platform

## ✨ my Idea

A lightweight web platform that allows both developers and non-developers to edit Markdown documents stored in a Git repository. This platform acts as a Git-backed knowledge base, accessible via a clean web interface and enhanced by AI editing support. It enables asynchronous documenting without requiring Git or code editor knowledge.

Use cases include:

- Documentation and internal wikis
- AI-assisted writing and refactoring
- Task lists and planning files

## 🎯 Goals

- Make Git content editable through a visual UI
- Let users work on `.md` files easily
- Enable AI-powered content suggestions or edits
- Maintain full Git history and version control
- Work even outside dev hours, tools, or technical knowledge

---

## 🔧 MVP Scope (v0.1)

### ✅ Core Features

- **GitHub Login**
  - Authenticate via GitHub OAuth
  - Use repo access token to fetch user data

- **Repo Browser**
  - List all repos user has access to
  - Select a repo to view/edit

- **File Navigator (Repo Detail Page)**
  - List repo files and directories
  - Display only `.md` files for editing

- **Markdown Editor**
  - Edit `.md` files with a live preview
  - Auto-save draft or save manually

- **AI Assistant (Sidebar Chat)**
  - Ask AI to summarize, improve, restructure, etc.
  - Inline editing suggestions
  - Slash commands supported (e.g. `/summarize`, `/improve tone`)

- **Git Commit & Push**
  - Stage modified files
  - Enter commit message
  - Push changes to repo via GitHub API
