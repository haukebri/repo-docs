import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../hooks/useApp';
import { GitHubService } from '../services/github.service';
import { parseGitHubUrl } from '../utils/github.utils';
import type { FileNode } from '../types/app.types';

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  onSelect: (node: FileNode) => void;
  selectedPath?: string;
  onLoadDirectory: (path: string) => Promise<FileNode[]>;
  onUpdateNode: (path: string, children: FileNode[]) => void;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, level, onSelect, selectedPath, onLoadDirectory, onUpdateNode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isSelected = selectedPath === node.path;

  const handleClick = async () => {
    if (node.type === 'directory') {
      if (!isExpanded && node.children === undefined) {
        setIsLoading(true);
        try {
          const children = await onLoadDirectory(node.path);
          onUpdateNode(node.path, children);
        } catch (error) {
          console.error(`Failed to load directory ${node.path}:`, error);
          onUpdateNode(node.path, []);
        } finally {
          setIsLoading(false);
        }
      }
      setIsExpanded(!isExpanded);
    } else {
      onSelect(node);
    }
  };

  return (
    <div className="file-tree-node">
      <div
        className={`file-tree-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={handleClick}
      >
        <span className="file-tree-icon">
          {node.type === 'directory' ? (
            isLoading ? '🔄' : isExpanded ? '📂' : '📁'
          ) : (
            '📄'
          )}
        </span>
        <span className="file-tree-name">{node.name}</span>
      </div>
      {node.type === 'directory' && isExpanded && node.children && (
        <div className="file-tree-children">
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
              onLoadDirectory={onLoadDirectory}
              onUpdateNode={onUpdateNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileBrowser: React.FC = () => {
  const { config, fileBrowser, setFileBrowser, currentRepo, setCurrentRepo } = useApp();
  const [githubService, setGithubService] = useState<GitHubService | null>(null);

  useEffect(() => {
    if (config?.githubToken) {
      setGithubService(new GitHubService(config.githubToken));
    }
  }, [config?.githubToken]);

  useEffect(() => {
    if (config?.repoUrl) {
      const repo = parseGitHubUrl(config.repoUrl);
      setCurrentRepo(repo);
    }
  }, [config?.repoUrl, setCurrentRepo]);

  const loadFiles = useCallback(async () => {
    if (!githubService || !currentRepo) return;

    setFileBrowser(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const files = await githubService.getRepoContents(currentRepo);
      setFileBrowser(prev => ({
        ...prev,
        files,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setFileBrowser(prev => ({
        ...prev,
        files: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load files',
      }));
    }
  }, [githubService, currentRepo, setFileBrowser]);

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubService, currentRepo]);

  const handleFileSelect = useCallback((node: FileNode) => {
    if (node.type !== 'file') return;

    setFileBrowser(prev => ({
      ...prev,
      selectedFile: node,
    }));
  }, [setFileBrowser]);

  const handleRefresh = () => {
    loadFiles();
  };

  const handleLoadDirectory = useCallback(async (path: string): Promise<FileNode[]> => {
    if (!githubService || !currentRepo) {
      throw new Error('GitHub service not initialized');
    }
    return githubService.loadDirectory(currentRepo, path);
  }, [githubService, currentRepo]);

  const updateNodeChildren = useCallback((targetPath: string, children: FileNode[]) => {
    const updateFileTreeNodes = (nodes: FileNode[], targetPath: string, children: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === targetPath) {
          return { ...node, children };
        }
        if (node.children) {
          return { ...node, children: updateFileTreeNodes(node.children, targetPath, children) };
        }
        return node;
      });
    };
    
    setFileBrowser(prev => ({
      ...prev,
      files: updateFileTreeNodes(prev.files, targetPath, children)
    }));
  }, [setFileBrowser]);

  if (!config || !currentRepo) {
    return (
      <div className="file-browser">
        <div className="file-browser-empty">
          Configure GitHub token and repository URL to browse files
        </div>
      </div>
    );
  }

  return (
    <div className="file-browser">
      <div className="file-browser-header">
        <h3>Files</h3>
        <button onClick={handleRefresh} className="refresh-button" title="Refresh">
          🔄
        </button>
      </div>
      {fileBrowser.isLoading && (
        <div className="file-browser-loading">Loading files...</div>
      )}
      {fileBrowser.error && (
        <div className="file-browser-error">
          Error: {fileBrowser.error}
        </div>
      )}
      {!fileBrowser.isLoading && !fileBrowser.error && (
        <div className="file-tree">
          {fileBrowser.files.length === 0 ? (
            <div className="file-browser-empty">No markdown files found</div>
          ) : (
            fileBrowser.files.map((node) => (
              <FileTreeNode
                key={node.path}
                node={node}
                level={0}
                onSelect={handleFileSelect}
                selectedPath={fileBrowser.selectedFile?.path}
                onLoadDirectory={handleLoadDirectory}
                onUpdateNode={updateNodeChildren}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};