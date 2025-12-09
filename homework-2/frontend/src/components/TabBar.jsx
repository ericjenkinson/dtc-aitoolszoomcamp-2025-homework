import React from 'react';
import { FileCode, File } from 'lucide-react';

export function TabBar({ files, activeFileId, onSelect, onClose }) {
    if (files.length === 0) return null;

    const getFileIcon = (name) => {
        if (name.endsWith('.py')) return <FileCode size={14} color="#3776AB" />;
        if (name.endsWith('.js')) return <FileCode size={14} color="#F0DB4F" />;
        return <File size={14} color="#ccc" />;
    };

    return (
        <div style={{
            display: 'flex',
            backgroundColor: '#252526',
            borderBottom: '1px solid #1e1e1e',
            overflowX: 'auto',
            height: '35px'
        }}>
            {files.map(file => {
                const isActive = file.id === activeFileId;
                const isDirty = file.content !== (file.savedContent || '');

                return (
                    <div
                        key={file.id}
                        onClick={() => onSelect(file.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 10px',
                            cursor: 'pointer',
                            backgroundColor: isActive ? '#1e1e1e' : '#2d2d2d',
                            color: isActive ? '#ffffff' : '#969696',
                            borderRight: '1px solid #1e1e1e',
                            borderTop: isActive ? '1px solid #007acc' : '1px solid transparent',
                            minWidth: '120px',
                            maxWidth: '200px',
                            fontSize: '13px',
                            userSelect: 'none',
                            gap: '8px'
                        }}
                        title={file.name}
                    >
                        {getFileIcon(file.name)}
                        <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                        }}>
                            {file.name}{isDirty ? '*' : ''}
                        </span>
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose(file.id);
                            }}
                            title="Close tab"
                            style={{
                                borderRadius: '3px',
                                padding: '0 4px',
                                fontSize: '16px',
                                lineHeight: '14px',
                                color: isActive ? '#fff' : '#ccc',
                                marginLeft: 'auto'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                            ×
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
