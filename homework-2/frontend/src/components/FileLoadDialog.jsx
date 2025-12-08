import React, { useState, useMemo } from 'react';

export function FileLoadDialog({ isOpen, onClose, files, onSelectFile }) {
    const [sortBy, setSortBy] = useState('name'); // 'name' | 'type'

    const sortedFiles = useMemo(() => {
        return [...files].sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else {
                // Sort by extension
                const extA = a.name.split('.').pop();
                const extB = b.name.split('.').pop();
                if (extA !== extB) return extA.localeCompare(extB);
                return a.name.localeCompare(b.name);
            }
        });
    }, [files, sortBy]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '8px',
                width: '500px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Load File</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.5rem' }}
                    >
                        &times;
                    </button>
                </div>

                {/* Toolbar */}
                <div style={{ padding: '10px 16px', display: 'flex', gap: '10px', borderBottom: '1px solid #333' }}>
                    <span style={{ color: '#888', marginRight: 'auto' }}>Sort by:</span>
                    <button
                        onClick={() => setSortBy('name')}
                        style={{
                            padding: '4px 8px',
                            backgroundColor: sortBy === 'name' ? '#4CAF50' : '#333',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Name
                    </button>
                    <button
                        onClick={() => setSortBy('type')}
                        style={{
                            padding: '4px 8px',
                            backgroundColor: sortBy === 'type' ? '#4CAF50' : '#333',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Type
                    </button>
                </div>

                {/* List */}
                <div style={{ overflowY: 'auto', padding: '10px', flex: 1 }}>
                    {sortedFiles.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No files found</div>
                    ) : (
                        sortedFiles.map(file => {
                            const isPy = file.name.endsWith('.py');
                            const isJs = file.name.endsWith('.js');
                            return (
                                <div
                                    key={file.id}
                                    data-testid={`file-row-${file.name}`}
                                    onClick={() => onSelectFile(file.id)}
                                    style={{
                                        padding: '10px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        color: '#ddd',
                                        borderBottom: '1px solid #2a2a2a'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <span style={{
                                        fontSize: '1.2rem',
                                        width: '24px',
                                        textAlign: 'center'
                                    }}>
                                        {isPy ? '🐍' : (isJs ? '📜' : '📄')}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold' }}>{file.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                            ID: {file.id} • {file.language || 'text'}
                                        </div>
                                    </div>
                                    <span style={{ color: '#4CAF50' }}>Load</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
