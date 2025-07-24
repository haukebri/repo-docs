import type { FileNode, GitHubRepo } from '../types/app.types';
import type { GitHubContent, GitHubError } from '../types/github.types';
import { isMarkdownFile, buildGitHubApiUrl } from '../utils/github.utils';

export class GitHubService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async fetchFromGitHub<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const error: GitHubError = await response.json();
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  async getRepoContents(repo: GitHubRepo, path: string = ''): Promise<FileNode[]> {
    const url = buildGitHubApiUrl(repo, path);
    const contents = await this.fetchFromGitHub<GitHubContent[]>(url);
    return this.transformToFileNodes(contents);
  }

  private transformToFileNodes(
    contents: GitHubContent[]
  ): FileNode[] {
    const nodes: FileNode[] = [];

    for (const item of contents) {
      if (item.type === 'file' && !isMarkdownFile(item.name)) {
        continue;
      }

      const node: FileNode = {
        name: item.name,
        path: item.path,
        type: item.type === 'dir' ? 'directory' : 'file',
        sha: item.sha,
        size: item.size,
      };

      if (item.type === 'dir') {
        node.children = undefined;
        nodes.push(node);
      } else {
        nodes.push(node);
      }
    }

    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  async loadDirectory(repo: GitHubRepo, path: string): Promise<FileNode[]> {
    const url = buildGitHubApiUrl(repo, path);
    const contents = await this.fetchFromGitHub<GitHubContent[]>(url);
    return this.transformToFileNodes(contents);
  }

  async getFileContent(repo: GitHubRepo, path: string): Promise<string> {
    const url = buildGitHubApiUrl(repo, path);
    const response = await this.fetchFromGitHub<GitHubContent>(url);

    if (response.content && response.encoding === 'base64') {
      // Properly decode base64 to UTF-8 to handle Unicode characters
      const binaryString = atob(response.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }

    throw new Error('Unable to decode file content');
  }

  async saveFile(
    repo: GitHubRepo,
    path: string,
    content: string,
    sha: string,
    message: string = 'Update file'
  ): Promise<{ content: GitHubContent }> {
    const url = buildGitHubApiUrl(repo, path);
    
    // Properly encode UTF-8 to base64 to handle Unicode characters
    const bytes = new TextEncoder().encode(content);
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    
    const body = {
      message,
      content: btoa(binaryString), // Base64 encode the UTF-8 bytes
      sha,
      branch: repo.branch || 'main',
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error: GitHubError = await response.json();
      throw new Error(error.message || `Failed to save file: ${response.status}`);
    }

    return response.json();
  }

}