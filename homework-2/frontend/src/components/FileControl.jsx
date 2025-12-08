import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileLoadDialog } from './FileLoadDialog';

export function FileControl({ fileName, onCreateFile, onSave, onLoadFile, onRun, isRunning, runReady, runButtonLabel }) {
    const [newFileName, setNewFileName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
    const [fileList, setFileList] = useState([]);

    const handleCreate = () => {
        if (newFileName.trim()) {
            onCreateFile(newFileName);
            setNewFileName('');
            setIsCreating(false);
        }
    };

    const openLoadDialog = async () => {
        const files = await api.listFiles();
        setFileList(files);
        setIsLoadDialogOpen(true);
    };

    return (
        <>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {isCreating ? (
                        <>
                            <input
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                placeholder="filename.js or .py"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreate();
                                    if (e.key === 'Escape') setIsCreating(false);
                                }}
                            />
                            <button onClick={handleCreate} style={{ backgroundColor: 'var(--success-color)' }}>Check</button>
                            <button onClick={() => setIsCreating(false)} style={{ backgroundColor: 'var(--danger-color)' }}>X</button>
                        </>
                    ) : (
                        <button onClick={() => setIsCreating(true)}>+ New File</button>
                    )}

                    <button data-testid="load-file-button" onClick={openLoadDialog}>Load File</button>
                </div>

                <div style={{ fontWeight: 'bold', marginLeft: '20px' }}>
                    {fileName ? fileName : 'No file selected'}
                </div>
            </div>

            <div style={{ padding: '10px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <button onClick={onSave} disabled={!fileName} style={{ marginRight: '10px' }}>Save</button>
                <div style={{ width: '1px', height: '20px', backgroundColor: '#333', margin: '0 10px', display: 'inline-block', verticalAlign: 'middle' }} />
                <button
                    data-testid="run-button"
                    onClick={onRun}
                    disabled={!runReady || isRunning}
                    style={{
                        opacity: (!runReady || isRunning) ? 0.5 : 1,
                        backgroundColor: isRunning ? '#d4a017' : '#4CAF50',
                        marginLeft: '5px'
                    }}
                >
                    {isRunning ? 'Running...' : (runButtonLabel || '▶ Run')}
                </button>
            </div>

            <FileLoadDialog
                isOpen={isLoadDialogOpen}
                onClose={() => setIsLoadDialogOpen(false)}
                files={fileList}
                onSelectFile={(id) => {
                    onLoadFile(id);
                    setIsLoadDialogOpen(false);
                }}
            />
        </>
    );
}
