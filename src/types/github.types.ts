export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

export interface GitHubCommit {
  message: string;
  content: string;
  sha: string;
  branch?: string;
}

export interface GitHubError {
  message: string;
  documentation_url?: string;
  status?: number;
}