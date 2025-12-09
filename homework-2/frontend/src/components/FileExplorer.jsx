import React from 'react';
import { FileCode, File } from 'lucide-react';

export function FileExplorer({ files, activeFileId, onSelectFile, onCreateFile }) {

    const getFileIcon = (name) => {
        if (name.endsWith('.py')) return <FileCode size={14} color="#3776AB" />;
        if (name.endsWith('.js')) return <FileCode size={14} color="#F0DB4F" />;
        return <File size={14} color="#ccc" />;
    };

    return (
        <div style={{
            width: '250px',
            backgroundColor: '#252526',
            borderRight: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
        }}>
            <div style={{
                padding: '10px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 'bold',
                color: '#ccc',
                fontSize: '12px',
                textTransform: 'uppercase'
            }}>
                <span>Explorer</span>
                <button
                    onClick={onCreateFile}
                    title="New File"
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '0 5px'
                    }}
                >
                    +
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {files.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
                        No files
                    </div>
                ) : (
                    files.map(file => (
                        <div
                            key={file.id}
                            onClick={() => onSelectFile(file.id)}
                            style={{
                                padding: '5px 10px',
                                cursor: 'pointer',
                                backgroundColor: file.id === activeFileId ? '#37373d' : 'transparent',
                                color: file.id === activeFileId ? '#fff' : '#ccc',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px'
                            }}
                            onMouseEnter={e => {
                                if (file.id !== activeFileId) e.currentTarget.style.backgroundColor = '#2a2d2e';
                            }}
                            onMouseLeave={e => {
                                if (file.id !== activeFileId) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                {getFileIcon(file.name)}
                            </span>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {file.name}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
