import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function FileControl({ onCreateFile, onSave, onLoadFile, fileName }) {
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
                            left: 0,
                            backgroundColor: '#2d2d2d',
                            border: '1px solid #444',
                            zIndex: 1000,
                            width: '200px',
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}>
                            {fileList.length === 0 ? (
                                <div style={{ padding: '8px', color: '#888' }}>No files found</div>
                            ) : (
                                fileList.map(f => (
                                    <div
                                        key={f.id}
                                        onClick={() => {
                                            onLoadFile(f.id);
                                            setIsLoading(false);
                                        }}
                                        style={{
                                            padding: '8px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #444',
                                            ':hover': { backgroundColor: '#3d3d3d' }
                                        }}
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
            </div>
        </div>
    );
}
