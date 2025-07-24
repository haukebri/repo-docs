import { useCallback, useEffect, useRef } from 'react';
import { useApp } from './useApp';
import { GitHubService } from '../services/github.service';
import type { FileNode } from '../types/app.types';

export const useFileLoader = () => {
  const { config, editorState, setEditorState, fileBrowser, currentRepo } = useApp();
  const loadingRef = useRef(false);

  const saveCurrentFile = useCallback(async () => {
    if (!config || !currentRepo || !editorState.currentFile || !editorState.isDirty) {
      return;
    }

    setEditorState(prev => ({ ...prev, isLoading: true }));

    try {
      const githubService = new GitHubService(config.githubToken);
      
      const response = await githubService.saveFile(
        currentRepo,
        editorState.currentFile.path,
        editorState.content,
        editorState.currentFile.sha || '',
        `Update ${editorState.currentFile.name}`
      );
      
      // Update state with new SHA from GitHub
      setEditorState(prev => ({
        ...prev,
        originalContent: prev.content,
        isDirty: false,
        isLoading: false,
        lastSaved: new Date(),
        currentFile: prev.currentFile ? {
          ...prev.currentFile,
          sha: response.content.sha,
        } : prev.currentFile,
      }));
    } catch (error) {
      console.error('Failed to save file:', error);
      setEditorState(prev => ({
        ...prev,
        isLoading: false,
      }));
      // TODO: Add user-friendly error handling
    }
  }, [config, currentRepo, editorState, setEditorState]);

  const loadFile = useCallback(
    async (file: FileNode) => {
      if (!config || !currentRepo || file.type !== 'file') return;

      // Prevent loading the same file if it's already current and not dirty
      if (editorState.currentFile?.path === file.path && !editorState.isDirty) {
        return;
      }

      // Prevent concurrent loads
      if (loadingRef.current) return;
      loadingRef.current = true;

      // Save current file if it has unsaved changes
      if (editorState.currentFile && editorState.isDirty) {
        await saveCurrentFile();
      }

      setEditorState(prev => ({
        ...prev,
        isLoading: true,
        currentFile: file,
      }));

      try {
        const githubService = new GitHubService(config.githubToken);
        const content = await githubService.getFileContent(currentRepo, file.path);

        setEditorState({
          content,
          originalContent: content,
          isDirty: false,
          isLoading: false,
          currentFile: file,
        });
      } catch (error) {
        console.error('Failed to load file:', error);
        setEditorState(prev => ({
          ...prev,
          isLoading: false,
          content: '',
          originalContent: '',
        }));
        // TODO: Add user-friendly error handling
      } finally {
        loadingRef.current = false;
      }
    },
    [config, currentRepo, editorState.currentFile, editorState.isDirty, setEditorState, saveCurrentFile]
  );

  // Load file when selected file changes
  useEffect(() => {
    const selectedFile = fileBrowser.selectedFile;
    if (selectedFile && 
        selectedFile.type === 'file' &&
        selectedFile.path !== editorState.currentFile?.path) {
      loadFile(selectedFile);
    }
  }, [fileBrowser.selectedFile, editorState.currentFile?.path, loadFile]);

  return {
    loadFile,
    saveFile: saveCurrentFile,
  };
};