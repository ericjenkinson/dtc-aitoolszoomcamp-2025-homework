import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function FileControl({ fileName, onCreateFile, onSave, onLoadFile, onRun, isRunning, isPyodideReady }) {
    const [newFileName, setNewFileName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fileList, setFileList] = useState([]);

    const handleCreate = () => {
        if (newFileName.trim()) {
            onCreateFile(newFileName);
            setNewFileName('');
            setIsCreating(false);
        }
    };

    const fetchFiles = async () => {
        const files = await api.listFiles();
        setFileList(files);
        setIsLoading(true);
    };

    return (
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

                <div style={{ position: 'relative' }}>
                    <button onClick={() => {
                        if (isLoading) {
                            setIsLoading(false);
                        } else {
                            fetchFiles();
                        }
                    }}>
                        {isLoading ? 'Close List' : 'Load File'}
                    </button>

                    {isLoading && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0, /* Changed from left: 0 to right: 0 */
                            backgroundColor: '#252526', /* Changed from #2d2d2d to #252526 */
                            border: '1px solid #333', /* Changed from #444 to #333 */
                            borderRadius: '4px', /* Added border-radius */
                            padding: '5px', /* Changed from 0 to 5px */
                            zIndex: 1000,
                            maxHeight: '200px', /* Changed from 300px to 200px */
                            overflowY: 'auto',
                            minWidth: '200px' /* Added min-width */
                        }}>
                            {fileList.length === 0 ? (
                                <div style={{ padding: '10px', color: '#888' }}>No files found</div> /* Changed padding from 8px to 10px */
                            ) : (
                                fileList.map(f => (
                                    <div
                                        key={f.id}
                                        onClick={() => {
                                            onLoadFile(f.id);
                                            setIsLoading(false);
                                        }}
                                        style={{
                                            padding: '5px 10px', /* Changed from 8px to 5px 10px */
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #333' /* Changed from #444 to #333 */
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#333'} /* Added hover effect */
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'} /* Added hover effect */
                                    >
                                        {f.name}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div style={{ fontWeight: 'bold', marginLeft: '20px' }}>
                    {fileName ? fileName : 'No file selected'}
                </div>
            </div>

            <div>
                <button onClick={onSave} disabled={!fileName}>Save</button>
                <div style={{ width: '1px', height: '20px', backgroundColor: '#333', margin: '0 10px', display: 'inline-block', verticalAlign: 'middle' }} />
                <button
                    data-testid="run-button"
                    onClick={onRun}
                    disabled={!isPyodideReady || isRunning}
                    style={{
                        opacity: (!isPyodideReady || isRunning) ? 0.5 : 1,
                        backgroundColor: isRunning ? '#d4a017' : '#4CAF50',
                        marginLeft: '5px'
                    }}
                >
                    {isRunning ? 'Running...' : (isPyodideReady ? '▶ Run' : 'Loading WASM...')}
                </button>
            </div>
        </div>
    );
}
