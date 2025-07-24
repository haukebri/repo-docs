import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import type { AppConfig } from '../types/app.types';

export const AuthScreen: React.FC = () => {
  const { setConfig } = useApp();
  const [formData, setFormData] = useState<AppConfig>({
    githubToken: '',
    repoUrl: '',
    openaiApiKey: '',
    openaiModel: 'gpt-4-turbo-preview',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.githubToken && formData.repoUrl && formData.openaiApiKey) {
      setConfig(formData);
    }
  };

  const handleChange = (field: keyof AppConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <div className="auth-screen">
      <h1>Git-AI Markdown Editor</h1>
      <p>Enter your credentials to get started</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="githubToken">GitHub Personal Access Token</label>
          <input
            id="githubToken"
            type="password"
            value={formData.githubToken}
            onChange={handleChange('githubToken')}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            required
          />
          <small>
            <a
              href="https://github.com/settings/tokens/new"
              target="_blank"
              rel="noopener noreferrer"
            >
              Generate a token
            </a>{' '}
            with repo scope
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="repoUrl">GitHub Repository URL</label>
          <input
            id="repoUrl"
            type="url"
            value={formData.repoUrl}
            onChange={handleChange('repoUrl')}
            placeholder="https://github.com/owner/repo"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="openaiApiKey">OpenAI API Key</label>
          <input
            id="openaiApiKey"
            type="password"
            value={formData.openaiApiKey}
            onChange={handleChange('openaiApiKey')}
            placeholder="sk-proj-xxxxxxxxxxxx"
            required
          />
          <small>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get your API key
            </a>{' '}
            from OpenAI
          </small>
        </div>

        <button type="submit">Connect</button>
      </form>
    </div>
  );
};