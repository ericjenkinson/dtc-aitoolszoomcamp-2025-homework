import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from './components/Editor';
import { FileControl } from './components/FileControl';
import { api } from './services/api';
import { Toast } from './components/Toast';
import { StatusLine } from './components/StatusLine';

import { usePyodide } from './hooks/usePyodide';
import { runJavascript } from './utils/jsRunner';
import { OutputPanel } from './components/OutputPanel';

const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#33FFF5'];

function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [remoteCursors, setRemoteCursors] = useState([]);
  const [userId] = useState(() => 'user-' + Math.random().toString(36).substr(2, 9));
  const [notification, setNotification] = useState(null); // { message, type }

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

  // Basic routing via query params 
  useEffect(() => {
    const fetchFile = async () => {
      const params = new URLSearchParams(window.location.search);
      const docId = params.get('doc');
      if (docId) {
        const file = await api.getFile(docId);
        if (file) {
          setCurrentFile(file);
          joinSession(docId);
        } else {
          // Handle 404 - for now just clear
          window.history.replaceState({}, '', '/');
        }
      }
    };
    fetchFile();
  }, []);

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

  const handleCreateFile = async (name) => {
    try {
      const newFile = await api.createFile(name, '// Start coding...');
      if (newFile) {
        setCurrentFile(newFile);
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('doc', newFile.id);
        window.history.pushState({}, '', url);

        joinSession(newFile.id);
        setNotification({ message: 'Created ' + name, type: 'success' });
      }
    } catch (err) {
      setNotification({ message: err.message || 'Failed to create file', type: 'error' });
    }
  };

  const handleSave = async () => {
    if (currentFile) {
      const success = await api.saveFile(currentFile.id, currentFile.content);
      if (success) {
        setNotification({ message: 'File saved successfully!', type: 'success' });
      } else {
        setNotification({ message: 'Failed to save file.', type: 'error' });
      }
    }
  };

  const handleLoadFile = async (id) => {
    const file = await api.getFile(id);
    if (file) {
      setCurrentFile(file);
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
    // update local state
    setCurrentFile(prev => ({ ...prev, content: newContent }));
  };

  const handleCursorChange = useCallback((pos) => {
    setCursorPosition(pos);
  }, []);

  return (
    <div className="App">
      <FileControl
        fileName={currentFile ? currentFile.name : null}
        onCreateFile={handleCreateFile}
        onSave={handleSave}
        onLoadFile={handleLoadFile}
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
          <p>Create a new file to start or ask your interviewer for a link.</p>
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

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }}>
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
  );
}

export default App;
