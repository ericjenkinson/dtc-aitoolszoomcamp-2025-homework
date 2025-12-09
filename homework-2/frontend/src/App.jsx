import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { ErrorBoundary } from './components/ErrorBoundary';

const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#33FFF5'];

function App() {
  const [currentInterview, setCurrentInterview] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [projectFiles, setProjectFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const activeSessionRef = useRef(null);

  const currentFile = openFiles.find(f => f.id === activeFileId) || null;
  const [remoteCursors, setRemoteCursors] = useState([]);
  const [userId] = useState(() => 'user-' + Math.random().toString(36).substr(2, 9));
  const [notification, setNotification] = useState(null);

  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    onCancel: () => { }
  });

  const { isReady: isPyodideReady, runPython, error: pyodideError } = usePyodide();
  const [executionOutput, setExecutionOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });

  useEffect(() => {
    if (pyodideError) setNotification({ message: 'Failed to load Python environment: ' + pyodideError, type: 'error' });
  }, [pyodideError]);

  // Persist Open Files
  useEffect(() => {
    if (openFiles.length > 0) {
      const ids = openFiles.map(f => f.id);
      localStorage.setItem('openFileIds', JSON.stringify(ids));
    }
  }, [openFiles]);

  // Initial Check
  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const interviewId = params.get('interview');
      if (interviewId) {
        const interviews = await api.getInterviews();
        const found = interviews.find(i => i.id === parseInt(interviewId));
        if (found) {
          setCurrentInterview(found);
          const files = await api.listFiles(found.id);
          setProjectFiles(files);

          // Restore open files
          const savedIds = localStorage.getItem('openFileIds');
          let idsToLoad = [];
          if (savedIds) {
            try {
              idsToLoad = JSON.parse(savedIds);
            } catch (e) { console.error('Failed to parse saved tabs', e); }
          }

          const docId = params.get('doc');
          if (docId && !idsToLoad.includes(docId) && !idsToLoad.includes(parseInt(docId))) {
            idsToLoad.push(docId);
          }

          // Load all files
          for (const id of idsToLoad) {
            // We can use handleLoadFile, but careful of race/broadcast.
            // Initial load should NOT broadcast.
            await handleLoadFile(id, found.id, false);
          }
        } else {
          window.history.replaceState({}, '', '/');
        }
      }
    };
    init();
  }, []);

  // WebSocket Connection (Per Interview)
  useEffect(() => {
    if (!currentInterview) return;

    // Disconnect existing
    if (activeSessionRef.current) {
      activeSessionRef.current.disconnect();
      activeSessionRef.current = null;
    }

    console.log('Connecting to interview session:', currentInterview.id);
    const { disconnect, sendMessage } = api.joinSession(currentInterview.id, userId, async (event) => {
      if (event.userId === userId) return; // Ignore own echoes if backend echoes (our backend DOES echos but excludes sender)

      switch (event.type) {
        case 'cursor_update':
          // Check if cursor is for ACTIVE file? Or render all?
          // Editor only shows cursors passed to it.
          // We typically filter by active file in Editor or here.
          // Since cursor pos is 2D (line/col), it only makes sense for the FILE it belongs to.
          // Payload should have fileId.
          if (event.fileId) { // Ensure fileId is present
            setRemoteCursors(prev => {
              const existing = prev.find(c => c.userId === event.userId && c.fileId === event.fileId);
              const color = existing ? existing.color : COLORS[Math.floor(Math.random() * COLORS.length)];
              const filtered = prev.filter(c => !(c.userId === event.userId && c.fileId === event.fileId));
              return [...filtered, {
                userId: event.userId,
                position: event.position,
                selection: event.selection, // Add selection
                color,
                name: 'Peer',
                fileId: event.fileId
              }];
            });
          }
          break;

        case 'content_update':
          setOpenFiles(prev => prev.map(f => {
            if (f.id === event.fileId) {
              return { ...f, content: event.content };
            }
            return f;
          }));
          break;

        case 'file_opened':
          // Remote user opened a file. We should open it too.
          // We need to fetch it first? Or does payload contain it?
          // Ideally payload has minimal info.
          const fileId = event.fileId;
          // Fix: Use `setOpenFiles` functional update to check existence, but we can't async fetch inside it.
          // Solution: Fetch outside, then update.
          const openedFile = await api.getFile(fileId);
          if (openedFile) {
            setOpenFiles(prev => {
              if (prev.find(f => f.id === fileId)) return prev;
              return [...prev, { ...openedFile, savedContent: openedFile.content }];
            });
          }
          break;

        case 'file_closed':
          setOpenFiles(prev => {
            const newFiles = prev.filter(f => f.id !== event.fileId);
            // Also need to handle activeFile switching if we closed the active one?
            // The remote user probably switched tab before closing, or we get a tab_switched event.
            // But if we just close it, we might end up with null active.
            // Let's rely on standard close logic (which updates active).
            // BUT inside `setOpenFiles` callback we can't update `activeFileId`.
            // We need to invoke close logic.
            // Limitation: We can't access `activeFileId` state here easily.
            // Let's just filter it out. If activeFileId points to it, UI handles null gracefully or we fix it.
            return newFiles;
          });
          // We should ideally sync active tab too.
          break;

        case 'tab_switched':
          setActiveFileId(event.fileId);
          break;

        case 'file_created':
          setProjectFiles(prev => [...prev, event.file]);
          setOpenFiles(prev => [...prev, { ...event.file, savedContent: '' }]); // Remote creation is unsaved? Or saved? 
          // Usually creation implies untitled unsaved physically.
          // But payload should dictate.
          break;

        case 'file_saved_as':
          const { oldId, file } = event;
          // 1. Update Project Files: Remove old temp (if present), add new file.
          setProjectFiles(prev => [...prev.filter(f => f.id !== oldId), file]);

          // 2. Update Open Files: find the tab with oldId and replace it in-place to keep order/focus context?
          // Actually, we want to update the ID and content/savedContent.
          setOpenFiles(prev => prev.map(f => {
            if (f.id === oldId) {
              return { ...file, savedContent: file.content };
            }
            return f;
          }));

          // 3. Update Active File ID if we were looking at the old temp file
          setActiveFileId(prev => (prev === oldId ? file.id : prev));
          break;

        case 'user_joined':
          setNotification({ message: 'User joined session', type: 'info' });
          break;
      }
    });

    activeSessionRef.current = { disconnect, sendMessage };

    return () => {
      disconnect();
    };
  }, [currentInterview, userId]); // Dependency on activeFileId needed for cursor filtering?
  // Be careful. adding activeFileId to deps means RECONNECTING WS on every tab switch! NO.
  // We should NOT filter cursors in the `switch`. We should filter them in RENDER.
  // Store all cursors in state: `{ fileId: { ...cursors } }`.
  // OR just store list and include fileId.

  // Helper to Broadcast
  const broadcast = (type, payload) => {
    if (activeSessionRef.current) {
      activeSessionRef.current.sendMessage({ type, ...payload });
    }
  };

  const handleSelectInterview = (interview) => {
    if (!interview) return;
    setCurrentInterview(interview);
    setOpenFiles([]);
    setProjectFiles([]);
    setActiveFileId(null);
    setExecutionOutput(null);
    api.listFiles(interview.id).then(files => setProjectFiles(files));
    const url = new URL(window.location);
    url.searchParams.set('interview', interview.id);
    url.searchParams.delete('doc');
    window.history.pushState({}, '', url);
  };

  const handleCreateFile = async () => {
    if (!currentInterview) return;
    const tempId = 'temp-' + Date.now();
    const newFile = {
      id: tempId,
      name: 'Untitled-' + (openFiles.filter(f => f.isTemp).length + 1),
      content: '',
      savedContent: '',
      language: 'plaintext',
      isTemp: true
    };

    setOpenFiles(prev => [...prev, newFile]);
    setActiveFileId(tempId);
    broadcast('file_created', { file: newFile });
    broadcast('tab_switched', { fileId: tempId });
  };

  const handleLoadFile = async (id, contextId, shouldBroadcast = true) => {
    const openFile = openFiles.find(f => f.id === id);
    if (openFile) {
      setActiveFileId(id);
      const url = new URL(window.location);
      url.searchParams.set('doc', id);
      window.history.pushState({}, '', url);
      if (shouldBroadcast) broadcast('tab_switched', { fileId: id });
      return;
    }

    const file = await api.getFile(id);
    if (file) {
      setOpenFiles(prev => {
        if (prev.some(f => f.id === file.id)) return prev;
        return [...prev, { ...file, savedContent: file.content }];
      });
      setActiveFileId(file.id);
      const url = new URL(window.location);
      url.searchParams.set('doc', file.id);
      window.history.pushState({}, '', url);

      if (shouldBroadcast) {
        broadcast('file_opened', { fileId: file.id });
        broadcast('tab_switched', { fileId: file.id });
      }
      setNotification({ message: 'Loaded ' + file.name, type: 'success' });
    }
  };

  const handleContentChange = (newContent) => {
    setOpenFiles(prev => prev.map(f => {
      if (f.id === activeFileId) return { ...f, content: newContent };
      return f;
    }));
    broadcast('content_update', { fileId: activeFileId, content: newContent });
  };

  const handleCursorChange = (cursorData) => {
    setCursorPosition({ line: cursorData.line, col: cursorData.col });
    // Broadcast cursor position (including selection)
    if (activeSessionRef.current) {
      activeSessionRef.current.sendMessage({
        type: 'cursor_update',
        position: cursorData.position,
        selection: cursorData.selection,
        fileId: activeFileId // Ensure fileId is sent for filtering
      });
    }
  };

  const handleTabSelect = (id) => {
    setActiveFileId(id);
    const file = openFiles.find(f => f.id === id);
    const url = new URL(window.location);
    if (file && !file.isTemp) {
      url.searchParams.set('doc', id);
    } else {
      url.searchParams.delete('doc');
    }
    window.history.pushState({}, '', url);

    broadcast('tab_switched', { fileId: id });
  };

  const handleTabClose = (id) => {
    const file = openFiles.find(f => f.id === id);
    if (!file) return;

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
        const newActive = newFiles.length > 0 ? newFiles[newFiles.length - 1].id : null;
        setActiveFileId(newActive);
        // broadcast switch? Or let remote side handle it logic?
        // If I close, I switch. Remote side receives 'file_closed'. 
        // Remote logic for file_closed should handle switching if active was closed.
      }
      return newFiles;
    });
    broadcast('file_closed', { fileId: id });
  };

  // ... (rest of functions handleExit, etc same or small updates) ...
  const handleExitInterview = () => {
    // ... same logic ...
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
    if (activeSessionRef.current) activeSessionRef.current.disconnect();
    setCurrentInterview(null);
    window.history.pushState({}, '', '/');
  };

  const handleSave = async () => {
    if (!currentFile) return;
    if (currentFile.isTemp) {
      setIsSaveAsOpen(true);
    } else {
      const success = await api.saveFile(currentFile.id, currentFile.content);
      if (success) {
        setNotification({ message: 'Saved!', type: 'success' });
        setOpenFiles(prev => prev.map(f => f.id === currentFile.id ? { ...f, savedContent: currentFile.content } : f));
      }
    }
  };

  const handleSaveAs = async (name) => {
    // ...
    if (!currentInterview || !currentFile) return;
    setIsSaveAsOpen(false);
    try {
      const newFile = await api.createFile(name, currentFile.content, currentInterview.id);
      if (newFile) {
        // Update local state
        setOpenFiles(prev => prev.map(f => f.id === currentFile.id ? { ...newFile, savedContent: newFile.content } : f));
        setActiveFileId(newFile.id);
        // Update project files
        setProjectFiles(prev => [...prev, newFile]);

        // Broadcast rename event so peers can update their lists and tabs locally
        broadcast('file_saved_as', { oldId: currentFile.id, file: newFile });
        // Also broadcast tab switch to the new ID
        broadcast('tab_switched', { fileId: newFile.id });
      }
    } catch (e) { setNotification({ message: e.message, type: 'error' }); }
  };

  const handleRun = async () => {
    // ... same as before ...
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

  if (!currentInterview) {
    return <InterviewManager onSelectInterview={handleSelectInterview} />;
  }

  // Filter cursors for active file
  const activeCursors = remoteCursors.filter(c => c.fileId === activeFileId);
  // !c.fileId for legacy check, but now we should enforce. 
  // Actually the event listener above didn't store fileId in remoteCursors state.
  // We need to fix that.

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'row', height: '100vh', overflow: 'hidden' }}>
      <SaveFileNameDialog isOpen={isSaveAsOpen} onClose={() => setIsSaveAsOpen(false)} onSave={handleSaveAs} />
      <ConfirmationDialog isOpen={confirmationDialog.isOpen} title={confirmationDialog.title} message={confirmationDialog.message} onConfirm={confirmationDialog.onConfirm} onCancel={confirmationDialog.onCancel} />
      <FileExplorer files={projectFiles} activeFileId={activeFileId} onSelectFile={(id) => handleLoadFile(id, null, true)} onCreateFile={handleCreateFile} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <FileControl fileName={currentFile?.name} interviewName={currentInterview.name} onExit={handleExitInterview} onSave={handleSave} onRun={handleRun} isRunning={isRunning} runReady={(currentFile && (currentFile.language === 'javascript' || currentFile.name.endsWith('.js'))) || isPyodideReady} runButtonLabel={(currentFile && (currentFile.language === 'python' || currentFile.name.endsWith('.py')) && !isPyodideReady) ? 'Loading WASM...' : '▶ Run'} />
        <TabBar files={openFiles} activeFileId={activeFileId} onSelect={handleTabSelect} onClose={handleTabClose} />
        <ErrorBoundary>
          <Editor
            file={currentFile}
            onChange={handleContentChange}
            remoteCursors={remoteCursors.filter(c => c.fileId === activeFileId)}
            onCursorChange={handleCursorChange}
          />
        </ErrorBoundary>
        {!currentFile && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <h1>Online Code Editor</h1>
            <p>Create a new file to start.</p>
          </div>
        )}

        {executionOutput && <OutputPanel output={executionOutput.output} result={executionOutput.result} error={executionOutput.error} onClose={() => setExecutionOutput(null)} data-testid="output-panel" />}
        {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

        <div style={{ zIndex: 100 }}>
          <StatusLine line={cursorPosition.line} col={cursorPosition.col} language={currentFile ? (currentFile.language || (currentFile.name.endsWith('.py') ? 'Python' : (currentFile.name.endsWith('.js') ? 'JavaScript' : 'Text'))) : 'Plain Text'} />
        </div>
      </div>
    </div>
  );
}

export default App;
