import type { GitHubRepo } from '../types/app.types';

export function parseGitHubUrl(url: string): GitHubRepo | null {
  try {
    const cleanUrl = url.trim().replace(/\/$/, '');
    
    const patterns = [
      /^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/,
      /^git@github\.com:([^/]+)\/([^.]+)\.git$/,
      /^([^/]+)\/([^/]+)$/
    ];
    
    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, ''),
          branch: match[3] || 'main'
        };
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

export function isMarkdownFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.md') || filename.toLowerCase().endsWith('.markdown');
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function getFileName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

export function getParentPath(path: string): string {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/');
}

export function buildGitHubApiUrl(repo: GitHubRepo, path: string = ''): string {
  const baseUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents`;
  return path ? `${baseUrl}/${path}` : baseUrl;
}

export function buildGitHubRawUrl(repo: GitHubRepo, path: string, branch?: string): string {
  const useBranch = branch || repo.branch || 'main';
  return `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${useBranch}/${path}`;
}