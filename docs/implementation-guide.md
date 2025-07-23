# Git-based Collaborative Knowledge Platform - Implementation Guide

## Project Setup

### Prerequisites

- Node.js 20.x LTS
- npm
- Docker (for deployment)
- GitHub OAuth App (for authentication)
- openAI API key (for AI features)

### Initial Project Structure

```
repo-docs/
├── frontend/               # React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utilities
│   │   ├── App.tsx        # Main App component
│   │   ├── main.tsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── public/            # Static assets
│   ├── index.html         # HTML template
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/               # Hono API server
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Auth, CORS, etc.
│   │   ├── db/            # Database schema and queries
│   │   └── index.ts       # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── shared/                # Shared types and utilities
│   ├── types/
│   └── utils/
├── docker/                # Docker configuration
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml
└── docs/                  # Documentation
```

## Phase 1: Core Setup

### Step 1: Initialize Monorepo

```bash

# Initialize root package.json
npm init -y

# Set up workspaces
cat > package.json << 'EOF'
{
  "name": "repo-docs",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "npm run dev -w backend",
    "dev:frontend": "npm run dev -w frontend",
    "build": "npm run build:shared && npm run build:backend && npm run build:frontend",
    "build:shared": "npm run build -w shared",
    "build:backend": "npm run build -w backend",
    "build:frontend": "npm run build -w frontend"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF
```

### Step 2: Create Shared Types

```bash
mkdir -p shared/src/types
cd shared

# Initialize shared package
npm init -y

# Install TypeScript
npm install -D typescript @types/node

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
EOF
```

Create shared types:

```typescript
// shared/src/types/auth.ts
export interface User {
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string;
}

export interface Session {
  id: string;
  userId: string;
  accessToken: string;
  expiresAt: Date;
}

// shared/src/types/github.ts
export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
}

export interface FileContent {
  path: string;
  content: string;
  sha: string;
  size: number;
}

// shared/src/types/api.ts
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
```

### Step 3: Set Up Backend

```bash
cd ../backend
npm init -y

# Install dependencies
npm install hono @hono/node-server dotenv zod
npm install -D typescript @types/node tsx nodemon

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "extends": "../shared/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@shared/*": ["../shared/src/*"]
    }
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
EOF
```

Create the main server file:

```typescript
// backend/src/index.ts
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { csrf } from 'hono/csrf';
import dotenv from 'dotenv';

import { authRoutes } from './routes/auth';
import { repoRoutes } from './routes/repos';
import { fileRoutes } from './routes/files';
import { Database } from './db';

dotenv.config();

const app = new Hono();

// Initialize database
const db = new Database();
db.initialize();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use('*', csrf());

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/repos', repoRoutes);
app.route('/api/files', fileRoutes);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

const port = parseInt(process.env.PORT || '3000');
serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running on http://localhost:${port}`);
```

### Step 4: Implement Authentication

Create GitHub OAuth service:

```typescript
// backend/src/services/github-auth.ts
import { z } from 'zod';

const GITHUB_OAUTH_URL = 'https://github.com/login/oauth';
const GITHUB_API_URL = 'https://api.github.com';

export class GitHubAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID!;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET!;
    this.redirectUri = process.env.GITHUB_REDIRECT_URI!;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'repo user:email',
      state,
    });
    return `${GITHUB_OAUTH_URL}/authorize?${params}`;
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch(`${GITHUB_OAUTH_URL}/access_token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description || 'Failed to exchange code');
    }

    return data.access_token;
  }

  async getUser(accessToken: string) {
    const response = await fetch(`${GITHUB_API_URL}/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return response.json();
  }
}
```

Create auth routes:

```typescript
// backend/src/routes/auth.ts
import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { GitHubAuthService } from '../services/github-auth';
import { SessionService } from '../services/session';

export const authRoutes = new Hono();

const githubAuth = new GitHubAuthService();
const sessionService = new SessionService();

authRoutes.get('/github', async (c) => {
  const state = crypto.randomUUID();
  // Store state in session for CSRF protection
  const authUrl = githubAuth.getAuthorizationUrl(state);
  return c.redirect(authUrl);
});

authRoutes.get('/github/callback', async (c) => {
  const { code, state } = c.req.query();
  
  if (!code) {
    return c.redirect('/login?error=no_code');
  }

  try {
    // Exchange code for token
    const accessToken = await githubAuth.exchangeCodeForToken(code);
    
    // Get user info
    const user = await githubAuth.getUser(accessToken);
    
    // Create session
    const session = await sessionService.createSession(user, accessToken);
    
    // Set session cookie
    setCookie(c, 'session_id', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    
    return c.redirect('/');
  } catch (error) {
    console.error('Auth error:', error);
    return c.redirect('/login?error=auth_failed');
  }
});

authRoutes.post('/logout', async (c) => {
  const sessionId = getCookie(c, 'session_id');
  
  if (sessionId) {
    await sessionService.deleteSession(sessionId);
    deleteCookie(c, 'session_id');
  }
  
  return c.json({ success: true });
});
```

### Step 5: Set Up Database

```typescript
// backend/src/db/index.ts
import Database from 'better-sqlite3';
import crypto from 'crypto';

export class Database {
  private db: Database.Database;

  constructor(filename = './data/app.db') {
    this.db = new Database(filename);
    this.db.pragma('journal_mode = WAL');
  }

  initialize() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        login TEXT UNIQUE NOT NULL,
        name TEXT,
        email TEXT,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        access_token_encrypted TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `);
  }

  // Encryption helpers
  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // User methods
  createOrUpdateUser(user: any) {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, login, name, email, avatar_url)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        email = excluded.email,
        avatar_url = excluded.avatar_url,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    return stmt.run(
      user.id.toString(),
      user.login,
      user.name,
      user.email,
      user.avatar_url
    );
  }

  // Session methods
  createSession(userId: string, accessToken: string, expiresIn = 30 * 24 * 60 * 60) {
    const sessionId = crypto.randomUUID();
    const encryptedToken = this.encrypt(accessToken);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, user_id, access_token_encrypted, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(sessionId, userId, encryptedToken, expiresAt.toISOString());
    
    return { id: sessionId, userId, expiresAt };
  }

  getSession(sessionId: string) {
    const stmt = this.db.prepare(`
      SELECT s.*, u.*
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `);
    
    const row = stmt.get(sessionId);
    
    if (!row) return null;
    
    return {
      id: row.id,
      user: {
        id: row.user_id,
        login: row.login,
        name: row.name,
        email: row.email,
        avatarUrl: row.avatar_url,
      },
      accessToken: this.decrypt(row.access_token_encrypted),
      expiresAt: new Date(row.expires_at),
    };
  }

  deleteSession(sessionId: string) {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    return stmt.run(sessionId);
  }

  cleanupExpiredSessions() {
    const stmt = this.db.prepare(`
      DELETE FROM sessions WHERE expires_at < datetime('now')
    `);
    return stmt.run();
  }
}
```

## Phase 2: Frontend Setup

### Step 1: Initialize React with Vite

```bash
cd ../frontend
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install
npm install react-router-dom axios
npm install -D tailwindcss postcss autoprefixer @types/react-router-dom
npm install @codemirror/lang-markdown @codemirror/theme-one-dark @uiw/react-codemirror
npm install marked dompurify @types/dompurify
npm install lucide-react

# Initialize Tailwind
npx tailwindcss init -p
```

### Step 2: Configure Vite and TypeScript

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

Update TypeScript config:

```json
// frontend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../shared/src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "../shared" }]
}
```

### Step 3: Create Auth Context

```typescript
// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import type { User } from '@shared/types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/user', {
        withCredentials: true,
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await axios.post('/api/auth/logout', {}, {
      withCredentials: true,
    });
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Step 4: Create App Component and Router

```tsx
// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import RepoPage from './pages/RepoPage';
import EditorPage from './pages/EditorPage';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/repo/:owner/:name" element={<RepoPage />} />
            <Route path="/repo/:owner/:name/*" element={<EditorPage />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

```tsx
// frontend/src/components/Layout.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const { user, loading, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Repo Docs</h1>
            </div>
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center gap-4">
                  <img
                    src={user.avatarUrl}
                    alt={user.name || user.login}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm">{user.login}</span>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Logout
                  </button>
                </div>
              ) : !loading ? (
                <a
                  href="/api/auth/github"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Login with GitHub
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}

export default Layout;
```

### Step 5: Create Repository Browser

```tsx
// frontend/src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import type { Repository } from '@shared/types/github';

function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || authLoading) {
      setLoading(false);
      return;
    }

    const fetchRepositories = async () => {
      try {
        const response = await axios.get('/api/repos', {
          withCredentials: true,
        });
        setRepositories(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, [user, authLoading]);

  if (!user && !authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Welcome to Repo Docs</h2>
          <p className="text-gray-600 mb-8">
            Collaboratively edit Markdown documents in your GitHub repositories.
          </p>
          <a
            href="/api/auth/github"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Get Started with GitHub
          </a>
        </div>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading repositories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {repositories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No repositories found.</p>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-6">Your Repositories</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {repositories.map((repo) => (
              <button
                key={repo.id}
                onClick={() => navigate(`/repo/${repo.fullName}`)}
                className="text-left p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-2">{repo.name}</h3>
                {repo.description && (
                  <p className="text-gray-600 text-sm">{repo.description}</p>
                )}
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  {repo.private ? (
                    <span className="bg-gray-100 px-2 py-1 rounded">Private</span>
                  ) : (
                    <span className="bg-green-100 px-2 py-1 rounded">Public</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
```

### Step 6: Create Main Entry Point

```tsx
// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

```css
/* frontend/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Phase 3: Markdown Editor

### Step 1: Create Editor Component

```tsx
// frontend/src/components/MarkdownEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
}

function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const [preview, setPreview] = useState('');

  useEffect(() => {
    const html = marked(content) as string;
    setPreview(DOMPurify.sanitize(html));
  }, [content]);

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b">
          <h3 className="font-semibold">Editor</h3>
        </div>
        <CodeMirror
          value={content}
          height="calc(100vh - 12rem)"
          theme={oneDark}
          extensions={[markdown()]}
          onChange={(value) => onChange(value)}
          className="h-[calc(100%-3rem)]"
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b">
          <h3 className="font-semibold">Preview</h3>
        </div>
        <div
          className="h-[calc(100%-3rem)] overflow-y-auto p-4 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      </div>
    </div>
  );
}

export default MarkdownEditor;
```

### Step 2: Create File Editor Page

```tsx
// frontend/src/pages/EditorPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MarkdownEditor from '../components/MarkdownEditor';
import type { FileContent } from '@shared/types/github';

function EditorPage() {
  const { owner, name, '*': filePath } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const fullPath = `${owner}/${name}/${filePath}`;

  useEffect(() => {
    loadFile();

    // Save on Ctrl+S
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [fullPath]);

  // Auto-save effect
  useEffect(() => {
    if (isDirty && !saving) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveFile();
      }, 30000); // 30 seconds
    }
  }, [isDirty, saving]);

  const loadFile = async () => {
    try {
      const response = await axios.get(`/api/repos/${fullPath}/contents`, {
        withCredentials: true,
      });
      setFile(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!file || saving) return;

    setSaving(true);
    setError(null);

    try {
      const response = await axios.put(
        `/api/repos/${fullPath}/contents`,
        {
          content: file.content,
          sha: file.sha,
          message: `Update ${file.path}`,
        },
        { withCredentials: true }
      );

      setFile({ ...file, sha: response.data.sha });
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (value: string) => {
    if (file) {
      setFile({ ...file, content: value });
      setIsDirty(true);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/repo/${owner}/${name}`)}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          {file && <h2 className="font-semibold">{file.path}</h2>}
        </div>

        <div className="flex items-center gap-4">
          {isDirty && <span className="text-sm text-gray-500">Unsaved changes</span>}
          <button
            onClick={saveFile}
            disabled={!isDirty || saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex-1 p-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading file...</p>
          </div>
        ) : (
          file && <MarkdownEditor content={file.content} onChange={handleChange} />
        )}
      </div>
    </div>
  );
}

export default EditorPage;
```

## Phase 4: AI Integration

### Step 1: Create AI Service

```typescript
// backend/src/services/ai.ts
import { Anthropic } from '@anthropic-ai/sdk';

export class AIService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  async generateSuggestion(
    content: string,
    instruction: string
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are helping edit a Markdown document. Here is the current content:

<document>
${content}
</document>

User instruction: ${instruction}

Please provide the improved version of the document. Return only the Markdown content, no explanations.`,
        },
      ],
    });

    return response.content[0].text;
  }

  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    context?: string
  ): Promise<ReadableStream> {
    const systemPrompt = `You are an AI assistant helping users edit and improve Markdown documents. Be helpful, concise, and focused on improving the content.${
      context ? `\n\nCurrent document context:\n${context}` : ''
    }`;

    const stream = await this.client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      messages,
      system: systemPrompt,
      stream: true,
    });

    return new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta') {
            controller.enqueue(
              new TextEncoder().encode(chunk.delta.text)
            );
          }
        }
        controller.close();
      },
    });
  }
}
```

### Step 2: Create AI Routes

```typescript
// backend/src/routes/ai.ts
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { AIService } from '../services/ai';
import { requireAuth } from '../middleware/auth';

export const aiRoutes = new Hono();
const aiService = new AIService();

aiRoutes.use('*', requireAuth);

aiRoutes.post('/suggest', async (c) => {
  const { content, instruction } = await c.req.json();

  if (!content || !instruction) {
    return c.json({ error: 'Content and instruction are required' }, 400);
  }

  try {
    const suggestion = await aiService.generateSuggestion(content, instruction);
    return c.json({ suggestion });
  } catch (error) {
    console.error('AI suggestion error:', error);
    return c.json({ error: 'Failed to generate suggestion' }, 500);
  }
});

aiRoutes.post('/chat', async (c) => {
  const { messages, context } = await c.req.json();

  if (!messages || !Array.isArray(messages)) {
    return c.json({ error: 'Messages array is required' }, 400);
  }

  try {
    const aiStream = await aiService.chat(messages, context);
    
    return stream(c, async (stream) => {
      const reader = aiStream.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await stream.write(value);
      }
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return c.json({ error: 'Failed to process chat' }, 500);
  }
});
```

### Step 3: Create AI Assistant Component

```tsx
// frontend/src/components/AIAssistant.tsx
import React, { useState } from 'react';
import { Send, Loader } from 'lucide-react';
import axios from 'axios';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  documentContent: string;
  onApplySuggestion: (content: string) => void;
}

function AIAssistant({ documentContent, onApplySuggestion }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
    };

    setMessages([...messages, userMessage, assistantMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          context: documentContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantMessage.content += chunk;
          setMessages((prev) => [...prev.slice(0, -1), { ...assistantMessage }]);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      assistantMessage.content = 'Sorry, I encountered an error. Please try again.';
      setMessages((prev) => [...prev.slice(0, -1), assistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold">AI Assistant</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.role === 'assistant' && message.content.includes('```') && (
                <button
                  onClick={() => onApplySuggestion(message.content)}
                  className="mt-2 text-sm underline"
                >
                  Apply this suggestion
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <Loader className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for help with your document..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      <style jsx>{`
        /* Custom scrollbar for chat */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}

export default AIAssistant;
```

## Deployment

### Docker Configuration

Create frontend Dockerfile:

```dockerfile
# docker/Dockerfile.frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm ci --workspace=shared --workspace=frontend

# Copy source files
COPY shared ./shared
COPY frontend ./frontend

# Build
RUN npm run build:shared
RUN npm run build:frontend

# Production stage
FROM caddy:alpine

COPY --from=builder /app/frontend/dist /srv
COPY docker/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443
```

Create backend Dockerfile:

```dockerfile
# docker/Dockerfile.backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm ci --workspace=shared --workspace=backend

# Copy source files
COPY shared ./shared
COPY backend ./backend

# Build
RUN npm run build:shared
RUN npm run build:backend

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
RUN npm ci --production --workspace=shared --workspace=backend

# Copy built files
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/dist ./backend/dist

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "backend/dist/index.js"]
```

Create Docker Compose:

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.backend
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_PATH=/app/data/app.db
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - GITHUB_REDIRECT_URI=${GITHUB_REDIRECT_URI}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - FRONTEND_URL=${FRONTEND_URL}
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  frontend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.frontend
    ports:
      - "80:80"
      - "443:443"
    environment:
      - DOMAIN=${DOMAIN}
    volumes:
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  caddy_data:
  caddy_config:
```

Create Caddyfile:

```
# docker/Caddyfile
{$DOMAIN:localhost} {
    root * /srv
    try_files {path} /index.html
    file_server
    encode gzip

    handle /api/* {
        reverse_proxy backend:3000
    }
}
```

### Environment Setup

Create `.env` file:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_REDIRECT_URI=https://your-domain.com/api/auth/github/callback

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Security
ENCRYPTION_KEY=your_32_byte_hex_key

# URLs
FRONTEND_URL=https://your-domain.com
DOMAIN=your-domain.com
```

### Deployment Commands

```bash
# Build and start services
cd docker
docker-compose up -d

# View logs
docker-compose logs -f

# Update and restart
git pull
docker-compose build
docker-compose up -d

# Backup database
docker-compose exec backend sqlite3 /app/data/app.db ".backup /app/data/backup.db"
```

## Security Checklist

- [ ] GitHub OAuth app configured with correct redirect URI
- [ ] ENCRYPTION_KEY generated with `openssl rand -hex 32`
- [ ] HTTPS enabled via Caddy
- [ ] Environment variables never committed to Git
- [ ] Database backups scheduled
- [ ] Rate limiting configured
- [ ] CORS restricted to frontend domain
- [ ] Session cookies secure flags enabled
- [ ] Input validation on all API endpoints
- [ ] Markdown sanitization enabled

## Conclusion

This implementation provides a secure, scalable foundation for a Git-based collaborative knowledge platform. The architecture separates concerns properly while maintaining simplicity, and the use of modern tools ensures good performance and developer experience.
