import React from 'react';

export function TabBar({ files, activeFileId, onSelect, onClose }) {
    if (files.length === 0) return null;

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
                            minWidth: '100px',
                            maxWidth: '200px',
                            fontSize: '13px',
                            userSelect: 'none'
                        }}
                        title={file.name}
                    >
                        <span style={{
                            marginRight: '8px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {file.name}
                        </span>
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose(file.id);
                            }}
                            style={{
                                borderRadius: '3px',
                                padding: '0 2px',
                                fontSize: '14px',
                                lineHeight: '14px',
                                color: isActive ? '#fff' : '#ccc'
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
