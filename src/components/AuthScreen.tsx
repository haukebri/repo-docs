import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import type { AppConfig } from '../types/app.types';

export const AuthScreen: React.FC = () => {
  const { setConfig } = useApp();
  const [formData, setFormData] = useState<AppConfig>({
    githubToken: '',
    repoUrl: '',
    claudeApiKey: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.githubToken && formData.repoUrl && formData.claudeApiKey) {
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
          <label htmlFor="claudeApiKey">Claude API Key</label>
          <input
            id="claudeApiKey"
            type="password"
            value={formData.claudeApiKey}
            onChange={handleChange('claudeApiKey')}
            placeholder="sk-ant-api03-xxxxxxxxxxxx"
            required
          />
          <small>
            <a
              href="https://console.anthropic.com/account/keys"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get your API key
            </a>{' '}
            from Anthropic
          </small>
        </div>

        <button type="submit">Connect</button>
      </form>
    </div>
  );
};