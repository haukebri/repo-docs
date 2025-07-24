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
      return atob(response.content);
    }

    throw new Error('Unable to decode file content');
  }

}