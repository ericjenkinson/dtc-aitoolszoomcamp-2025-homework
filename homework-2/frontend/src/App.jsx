import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from './components/Editor';
import { FileControl } from './components/FileControl';
import { mockBackend as api } from './services/api';
import { Toast } from './components/Toast';

import { usePyodide } from './hooks/usePyodide';
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
      const result = await runPython(currentFile.content);
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

  return (
    <div className="App">
      <FileControl
        fileName={currentFile?.name}
        onCreateFile={handleCreateFile}
        onSave={handleSave}
        onLoadFile={handleLoadFile}
        onRun={handleRun}
        isRunning={isRunning}
        isPyodideReady={isPyodideReady}
      />

      <Editor
        file={currentFile}
        onChange={handleContentChange}
        remoteCursors={remoteCursors}
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

      {executionOutput && (
        <OutputPanel
          output={executionOutput.output}
          result={executionOutput.result}
          error={executionOutput.error}
          onClose={() => setExecutionOutput(null)}
        />
      )}

      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

export default App;
