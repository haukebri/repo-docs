# Git-based Collaborative Knowledge Platform - Technical Architecture

## Overview

This document describes the technical architecture for a web-based platform that enables collaborative editing of Markdown documents stored in Git repositories. The platform provides a user-friendly interface for non-technical users while maintaining full Git version control capabilities.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Web Browser    │────▶│  Backend API    │────▶│  GitHub API     │
│  (React SPA)    │     │  (Hono/Node.js) │     │                 │
│                 │     │                 │     └─────────────────┘
└─────────────────┘     │                 │
                        │                 │     ┌─────────────────┐
                        │                 │────▶│                 │
                        │                 │     │  Anthropic API  │
                        │                 │     │                 │
                        └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │     SQLite      │
                        │   (Sessions)    │
                        └─────────────────┘
```

### Component Overview

1. **Frontend (React)**
   - Single Page Application with client-side routing
   - React Context for state management
   - Real-time updates via Server-Sent Events (SSE)
   - Responsive design for mobile and desktop

2. **Backend API (Hono)**
   - Lightweight, fast API server
   - Handles authentication flow
   - Proxies GitHub API requests
   - Manages AI interactions
   - Session management

3. **Data Storage**
   - SQLite for session storage and user preferences
   - GitHub as the source of truth for all content
   - Local caching for performance optimization

## Technology Stack

### Frontend
- **Framework**: React 18.x with TypeScript
- **Routing**: React Router v6
- **State Management**: React Context + hooks
- **UI Components**: Custom components with Tailwind CSS
- **Editor**: CodeMirror 6
- **Markdown Rendering**: marked + DOMPurify
- **API Client**: Axios with type-safe wrappers
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js 20.x LTS
- **Framework**: Hono (lightweight, ~20KB)
- **Database**: SQLite with better-sqlite3
- **Authentication**: GitHub OAuth 2.0
- **Session Management**: Custom implementation with secure cookies
- **TypeScript**: Strict mode with full type coverage

### Infrastructure
- **Container**: Docker with multi-stage builds
- **Web Server**: Caddy (automatic HTTPS)
- **Process Manager**: Node.js cluster mode
- **Monitoring**: Basic health checks and logging

## Authentication Flow

### OAuth 2.0 Implementation

1. **Login Initiation**
   ```
   User clicks "Login with GitHub"
   → Frontend redirects to /api/auth/github
   → Backend redirects to GitHub OAuth with state parameter
   ```

2. **GitHub Authorization**
   ```
   User authorizes app on GitHub
   → GitHub redirects to /api/auth/github/callback
   → Backend exchanges code for access token
   ```

3. **Session Creation**
   ```
   Backend creates secure session
   → Stores encrypted token in SQLite
   → Sets HTTP-only secure cookie
   → Redirects to frontend with success
   ```

4. **Token Security**
   - Access tokens encrypted at rest using AES-256-GCM
   - Session cookies with SameSite=Strict, Secure, HttpOnly
   - 30-day token expiration with refresh capability
   - Automatic token revocation on logout

## API Design

### RESTful Endpoints

```
Authentication:
GET    /api/auth/github          - Initiate OAuth flow
GET    /api/auth/github/callback - OAuth callback
POST   /api/auth/logout          - Logout and revoke token
GET    /api/auth/user            - Get current user info

Repositories:
GET    /api/repos                - List user's repositories
GET    /api/repos/:owner/:repo   - Get repository details
GET    /api/repos/:owner/:repo/tree - Get file tree

Files:
GET    /api/repos/:owner/:repo/contents/*path - Get file content
PUT    /api/repos/:owner/:repo/contents/*path - Update file
DELETE /api/repos/:owner/:repo/contents/*path - Delete file

AI Assistant:
POST   /api/ai/chat              - Send message to AI
POST   /api/ai/suggest           - Get AI suggestions for content

Collaboration:
GET    /api/collab/session/:id   - Join collaboration session
WS     /api/collab/ws/:id        - WebSocket for real-time updates
```

### API Security
- All endpoints require authentication except auth routes
- Rate limiting: 100 requests per minute per user
- Request size limits: 10MB for file uploads
- CORS configured for frontend origin only

## Data Flow

### Reading Files
1. Frontend requests file content
2. Backend checks session validity
3. Backend fetches from GitHub API with user token
4. Content cached for 5 minutes
5. Markdown parsed and sanitized
6. Returned to frontend for display

### Writing Files
1. User edits in CodeMirror
2. Auto-save to local storage every 30 seconds
3. Manual save triggers API call
4. Backend validates content
5. Creates commit via GitHub API
6. Updates cache
7. Broadcasts change to collaborators

### AI Integration
1. User requests AI assistance
2. Backend validates request
3. Proxies to Anthropic API with system prompts
4. Streams response back to frontend
5. User can apply suggestions with one click

## Security Considerations

### Authentication & Authorization
- GitHub OAuth 2.0 with PKCE
- Repository access based on GitHub permissions
- No elevated privileges beyond user's GitHub access

### Data Protection
- All API communication over HTTPS
- Sensitive data encrypted at rest
- No storage of repository content on server
- PII limited to GitHub user info

### Input Validation
- Markdown content sanitized with DOMPurify
- File paths validated against directory traversal
- API inputs validated with Zod schemas
- SQL injection prevented via parameterized queries

### Rate Limiting & DDoS Protection
- API rate limiting per user
- Cloudflare or similar CDN for DDoS protection
- Resource limits on Docker containers
- Graceful degradation under load

## Performance Optimization

### Caching Strategy
- GitHub API responses cached for 5 minutes
- Static assets cached for 1 year with hash-based URLs
- Service Worker for offline markdown viewing
- SQLite query results cached in memory

### Bundle Optimization
- Code splitting by route
- Lazy loading for editor and AI components
- Tree shaking for minimal bundle size
- Compression with Brotli

### Server Optimization
- Node.js cluster mode for multi-core utilization
- Connection pooling for external APIs
- Streaming responses for large files
- Efficient SQLite queries with indexes

## Scalability Considerations

### Horizontal Scaling
- Stateless backend design
- Sessions in shared SQLite or Redis
- Load balancer with sticky sessions
- CDN for static assets

### Vertical Scaling
- Configurable worker processes
- Memory limits per process
- Database connection limits
- Queue system for heavy operations

## Monitoring and Observability

### Logging
- Structured JSON logs
- Log levels: ERROR, WARN, INFO, DEBUG
- Centralized log aggregation
- Sensitive data redaction

### Metrics
- Request duration histograms
- Error rates by endpoint
- Active sessions count
- GitHub API usage

### Health Checks
- `/health` endpoint for container health
- Database connectivity check
- External API availability
- Memory and CPU usage

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development servers
npm run dev         # Starts both frontend and backend

# Run tests
npm test           # Unit and integration tests
npm run test:e2e   # End-to-end tests
```

### Code Quality
- ESLint + Prettier for code formatting
- TypeScript strict mode
- Pre-commit hooks with Husky
- Automated testing in CI/CD

### Deployment Pipeline
1. Code pushed to GitHub
2. CI runs tests and builds
3. Docker image built and tagged
4. Deployed to server via Docker Compose
5. Health checks verify deployment
6. Rollback on failure

## Future Enhancements

### Phase 1 (MVP)
- [x] Basic authentication
- [x] Repository browsing
- [x] Markdown editing
- [x] Git commits

### Phase 2
- [ ] AI assistant integration
- [ ] Collaborative editing
- [ ] Change history viewer
- [ ] Search functionality

### Phase 3
- [ ] Real-time collaboration
- [ ] Offline support
- [ ] Mobile app
- [ ] Plugin system

### Phase 4
- [ ] Team management
- [ ] Access control
- [ ] Audit logs
- [ ] Enterprise features