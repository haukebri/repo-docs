# 📄 MVP Technical Summary – Git-AI Markdown Editor

## 🎯 Goal

Build a **web-based Markdown editor** connected to GitHub, with integrated AI support via Anthropic’s Claude API. Users can edit `.md` files directly in their repo, ask for AI help, and commit changes — all from a browser.

---

## ✅ Core Business Requirements

### 1. **Authentication & Access**

- No login or OAuth.
- User **manually pastes**:
  - GitHub **Personal Access Token (PAT)**
  - **GitHub Repo URL**
  - **Claude API Key**

> Minimal setup, no user accounts, no token storage needed.

---

### 2. **GitHub File Access**

- GitHub API used to:
  - List `.md` files in repo
  - Load file contents
  - Commit updated content back
- Only `.md` files are visible/editable.
- GitHub only (no GitLab/Bitbucket).

---

### 3. **AI Chat Integration**

- Uses Anthropic Claude API
- Chat box available in the editor
- Sends current file content + user question
- Claude's response is shown in chat — user can:
  - Insert it into the file
  - Copy it manually

---

## 🖥️ Web UI

- Clean, minimal SPA interface:
  - File browser/sidebar (only `.md`)
  - Markdown editor (@uiw/react-md-editor)
  - AI chat panel
  - Save/Commit button

---

## 🐳 Deployment (Important)

### Containerized Setup

- Full app runs inside a **Docker container**
- Can be deployed on a **Cockpit-managed VPS** via **webhook**
- Self-contained stack:
  - Frontend (React)
  - Optional minimal backend for:
    - CORS proxying GitHub API
    - Handling Claude API if needed

### Example Docker Image Structure

- Base image: `node:18-alpine` (or your stack's default)
- Port: `3000` or as configured
- CMD: `npm run start` or equivalent

---

## 🧱 MVP Scope

### Included

- Manual token entry (GitHub + Claude)
- Read/write `.md` files via GitHub REST API
- Claude API integration
- SPA served via Docker container
- Deployed via Cockpit webhook

### Excluded (for MVP)

- User login or token storage
- GitLab, Bitbucket support
- Multi-agent AI
- Server-side Git CLI
- Auth

---

## 📦 Deliverables

- `Dockerfile` and build instructions
- `docker-compose.yml` if needed
- SPA frontend code
- Optional: tiny backend (Node/Express or similar) for API proxying
