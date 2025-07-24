/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ENABLE_AI_CHAT?: string
  readonly VITE_ENABLE_AUTO_SAVE?: string
  readonly VITE_GITHUB_TOKEN?: string
  readonly VITE_GITHUB_REPO_URL?: string
  readonly VITE_OPENAI_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
