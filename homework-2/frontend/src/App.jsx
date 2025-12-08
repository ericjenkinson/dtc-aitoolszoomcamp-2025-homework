import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from './components/Editor';
import { InterviewManager } from './components/InterviewManager';
import { FileControl } from './components/FileControl';
import { api } from './services/api';
import { Toast } from './components/Toast';
import { StatusLine } from './components/StatusLine';
import { TabBar } from './components/TabBar';
import { SaveFileNameDialog } from './components/SaveFileNameDialog';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { FileExplorer } from './components/FileExplorer';
import { usePyodide } from './hooks/usePyodide';
import { runJavascript } from './utils/jsRunner';
import { OutputPanel } from './components/OutputPanel';

const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#33FFF5'];

function App() {
  const [currentInterview, setCurrentInterview] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [projectFiles, setProjectFiles] = useState([]); // All files in interview
  const [activeFileId, setActiveFileId] = useState(null);

  // Derived state
  const currentFile = openFiles.find(f => f.id === activeFileId) || null;
  const [remoteCursors, setRemoteCursors] = useState([]);
  const [userId] = useState(() => 'user-' + Math.random().toString(36).substr(2, 9));
  const [notification, setNotification] = useState(null); // { message, type }

  // Dialog state
  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    onCancel: () => { }
  });

  // Execution state
  const { isReady: isPyodideReady, runPython, error: pyodideError } = usePyodide();
  const [executionOutput, setExecutionOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // Status Bar state
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });

  useEffect(() => {
    if (pyodideError) {
      setNotification({ message: 'Failed to load Python environment: ' + pyodideError, type: 'error' });
    }
  }, [pyodideError]);

  // Initial load: Check for interview param
  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const interviewId = params.get('interview');

      if (interviewId) {
        // Validation: fetch interviews and check if valid
        // Ideally we'd have api.getInterview(id) but checking list is ok for now
        const interviews = await api.getInterviews();
        const found = interviews.find(i => i.id === parseInt(interviewId));
        if (found) {
          setCurrentInterview(found);
          // Load project files
          const files = await api.listFiles(found.id);
          setProjectFiles(files);

          // If valid interview, check for doc
          const docId = params.get('doc');
          if (docId) handleLoadFile(docId, found.id); // Pass interview ID explicitly just in case
        } else {
          // Invalid interview ID
          window.history.replaceState({}, '', '/');
        }
      }
    };
    init();
  }, []);

  const handleSelectInterview = (interview) => {
    if (!interview) return;
    setCurrentInterview(interview);
    setOpenFiles([]);
    if (!interview) return;
    setCurrentInterview(interview);
    setOpenFiles([]);
    setProjectFiles([]);
    setActiveFileId(null);
    setExecutionOutput(null);

    // Load files
    api.listFiles(interview.id).then(files => setProjectFiles(files));

    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('interview', interview.id);
    url.searchParams.delete('doc'); // Clear doc on interview switch
    window.history.pushState({}, '', url);
  };

  const joinSession = useCallback((fileId) => {
    setRemoteCursors([]); // connect to new session
    const disconnect = api.joinSession(fileId, userId, (event) => {
      if (event.type === 'cursor_update') {
        if (event.userId === userId) return; // ignore self

        setRemoteCursors(prev => {
          const existing = prev.find(c => c.userId === event.userId);
          const color = existing ? existing.color : COLORS[Math.floor(Math.random() * COLORS.length)];

          const filtered = prev.filter(c => c.userId !== event.userId);
          return [...filtered, {
            userId: event.userId,
            position: event.position,
            color,
            name: existing?.name || 'Peer'
          }];
        });
      }
      else if (event.type === 'user_joined') {
        console.log('User joined:', event.name);
      }
    });

    return disconnect;
  }, [userId]);

  const handleCreateFile = async () => {
    if (!currentInterview) return;
    const tempId = 'temp-' + Date.now();
    const newFile = {
      id: tempId,
      name: 'Untitled-' + (openFiles.filter(f => f.isTemp).length + 1),
      content: '',
      savedContent: '', // For dirty check
      language: 'plaintext',
      isTemp: true
    };

    setOpenFiles(prev => [...prev, newFile]);
    setActiveFileId(tempId);
    // Not updating URL for untitled files to avoid invalid state
  };

  const handleSave = async () => {
    if (currentFile) {
      if (currentFile.isTemp) {
        setIsSaveAsOpen(true);
      } else {
        const success = await api.saveFile(currentFile.id, currentFile.content);
        if (success) {
          setNotification({ message: 'File saved successfully!', type: 'success' });
          // Update savedContent
          setOpenFiles(prev => prev.map(f => {
            if (f.id === currentFile.id) return { ...f, savedContent: currentFile.content };
            return f;
          }));
        } else {
          setNotification({ message: 'Failed to save file.', type: 'error' });
        }
      }
    }
  };

  const handleSaveAs = async (name) => {
    if (!currentInterview || !currentFile) return;
    setIsSaveAsOpen(false);

    try {
      const newFile = await api.createFile(name, currentFile.content, currentInterview.id);
      if (newFile) {
        setOpenFiles(prev => prev.map(f => {
          if (f.id === currentFile.id) return { ...newFile, savedContent: newFile.content };
          return f;
        }));
        setActiveFileId(newFile.id);

        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('doc', newFile.id);
        window.history.pushState({}, '', url);

        joinSession(newFile.id);

        // Add to project files
        setProjectFiles(prev => [...prev, newFile]);

        setNotification({ message: 'Saved as ' + name, type: 'success' });
      }
    } catch (err) {
      setNotification({ message: err.message || 'Failed to create file', type: 'error' });
      // Re-open dialog on error? Or just show notification.
      // If error, keeping as untitled.
    }
  };

  // contextId arg is optional, mostly for initial load when state isn't set yet
  // but logic inside usage currentInterview for regular clicks
  const handleLoadFile = async (id, contextId) => {
    // Check if already open first to avoid refetching/overwriting dirty state
    const openFile = openFiles.find(f => f.id === id);
    if (openFile) {
      setActiveFileId(id);
      // Update URL
      const url = new URL(window.location);
      url.searchParams.set('doc', id);
      window.history.pushState({}, '', url);
      return;
    }

    const file = await api.getFile(id);
    if (file) {
      // Security/Consistency check: 
      // Theoretically a user could load a file from another interview if they knew the ID.
      // Backend should probably enforce `interview_id` in getFile too if we want strict security.
      // For now we assume if it's listed, it's valid.

      setOpenFiles(prev => {
        return [...prev, { ...file, savedContent: file.content }];
      });
      setActiveFileId(file.id);

      // Update URL
      const url = new URL(window.location);
      url.searchParams.set('doc', file.id);
      window.history.pushState({}, '', url);

      joinSession(file.id);
      setNotification({ message: 'Loaded ' + file.name, type: 'success' });
    }
  };

  const handleRun = async () => {
    if (!currentFile || !currentFile.content) return;

    setIsRunning(true);
    setExecutionOutput(null);

    try {
      let result;
      if (currentFile.language === 'python' || currentFile.name.endsWith('.py')) {
        result = await runPython(currentFile.content);
      } else if (currentFile.language === 'javascript' || currentFile.name.endsWith('.js')) {
        result = await runJavascript(currentFile.content);
      } else {
        result = { error: 'Unsupported language for execution' };
      }
      setExecutionOutput(result);
    } catch (err) {
      setExecutionOutput({ error: err.toString() });
    } finally {
      setIsRunning(false);
    }
  };

  const handleContentChange = (newContent) => {
    // update local state of the ACTIVE file
    setOpenFiles(prev => prev.map(f => {
      if (f.id === activeFileId) {
        return { ...f, content: newContent };
      }
      return f;
    }));
  };

  const handleTabSelect = (id) => {
    setActiveFileId(id);
    const file = openFiles.find(f => f.id === id);
    if (!file) return;

    // Update URL
    const url = new URL(window.location);
    if (file && !file.isTemp) {
      url.searchParams.set('doc', id);
      joinSession(id);
    } else {
      url.searchParams.delete('doc');
      setRemoteCursors([]); // clear cursors for temp
    }
    window.history.pushState({}, '', url);
  };

  const handleTabClose = (id) => {
    const file = openFiles.find(f => f.id === id);
    if (!file) return;

    // Check for dirty
    const isDirty = file.content !== (file.savedContent || '');
    if (isDirty) {
      setConfirmationDialog({
        isOpen: true,
        title: 'Unsaved Changes',
        message: `You have unsaved changes in ${file.name}. Close without saving?`,
        onConfirm: () => {
          setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
          closeTab(id);
        },
        onCancel: () => setConfirmationDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    closeTab(id);
  };

  const closeTab = (id) => {

    setOpenFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      if (activeFileId === id) {
        // Switch to last available or null
        const newActive = newFiles.length > 0 ? newFiles[newFiles.length - 1].id : null;
        setActiveFileId(newActive);
        if (newActive) {
          const url = new URL(window.location);
          url.searchParams.set('doc', newActive); // Ensure we use the NEW active ID
          const activeFile = newFiles.find(f => f.id === newActive);
          if (activeFile && !activeFile.isTemp) {
            window.history.pushState({}, '', url);
          } else {
            // If switching to temp or null, just keep interview param
            const u = new URL(window.location);
            u.searchParams.set('interview', currentInterview.id);
            u.searchParams.delete('doc'); // Temp files don't have URL persistence
            window.history.pushState({}, '', u);
          }
          if (activeFile && !activeFile.isTemp) joinSession(newActive);
        } else {
          // No files left
          const url = new URL(window.location);
          url.searchParams.delete('doc');
          window.history.pushState({}, '', url);
        }
      }
      return newFiles;
    });
  };

  const handleExitInterview = () => {
    const dirtyFiles = openFiles.filter(f => f.content !== (f.savedContent || ''));
    if (dirtyFiles.length > 0) {
      setConfirmationDialog({
        isOpen: true,
        title: 'Unsaved Changes',
        message: `You have ${dirtyFiles.length} unsaved file(s). Exit interview without saving?`,
        onConfirm: () => {
          setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
          performExit();
        },
        onCancel: () => setConfirmationDialog(prev => ({ ...prev, isOpen: false }))
      });
    } else {
      performExit();
    }
  };

  const performExit = () => {
    setCurrentInterview(null);
    window.history.pushState({}, '', '/');
  };

  const handleCursorChange = (position) => {
    setCursorPosition(position);
    // Future: Broadcast cursor position via WebSocket
  };

  // ... (cursor handler) ...

  if (!currentInterview) {
    return (
      <InterviewManager onSelectInterview={handleSelectInterview} />
    );
  }

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'row', height: '100vh', overflow: 'hidden' }}>
      <SaveFileNameDialog
        isOpen={isSaveAsOpen}
        onClose={() => setIsSaveAsOpen(false)}
        onSave={handleSaveAs}
      />

      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        onConfirm={confirmationDialog.onConfirm}
        onCancel={confirmationDialog.onCancel}
      />

      <FileExplorer
        files={projectFiles}
        activeFileId={activeFileId}
        onSelectFile={handleLoadFile}
        onCreateFile={handleCreateFile}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <FileControl
          fileName={currentFile ? currentFile.name : null}
          interviewName={currentInterview.name}
          onExit={handleExitInterview}
          onSave={handleSave}
          onRun={handleRun}
          isRunning={isRunning}
          runReady={
            (currentFile && (currentFile.language === 'javascript' || currentFile.name.endsWith('.js'))) ||
            isPyodideReady
          }
          runButtonLabel={
            (currentFile && (currentFile.language === 'python' || currentFile.name.endsWith('.py')) && !isPyodideReady)
              ? 'Loading WASM...'
              : '▶ Run'
          }
        />

        <TabBar
          files={openFiles}
          activeFileId={activeFileId}
          onSelect={handleTabSelect}
          onClose={handleTabClose}
        />

        <Editor
          file={currentFile}
          onChange={handleContentChange}
          remoteCursors={remoteCursors}
          onCursorChange={handleCursorChange}
        />

        {!currentFile && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <h1>Online Code Editor</h1>
            <p>Create a new file to start.</p>
          </div>
        )}

        {/* Adjust OutputPanel position if needed, or overlay it. StatusLine is fixed at bottom. */}
        {executionOutput && (
          <OutputPanel
            output={executionOutput.output}
            result={executionOutput.result}
            error={executionOutput.error}
            onClose={() => setExecutionOutput(null)}
            data-testid="output-panel"
          />
        )}

        {notification && (
          <Toast
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <div style={{ zIndex: 100 }}>
          <StatusLine
            line={cursorPosition.line}
            col={cursorPosition.col}
            language={
              currentFile
                ? (currentFile.language || (currentFile.name.endsWith('.py') ? 'Python' : (currentFile.name.endsWith('.js') ? 'JavaScript' : 'Text')))
                : 'Plain Text'
            }
          />
        </div>
      </div>
    </div>
  );
}

export default App;
