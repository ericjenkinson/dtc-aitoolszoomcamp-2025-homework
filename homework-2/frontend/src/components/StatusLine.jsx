import React from 'react';

export function StatusLine({ line, col, indentation = 'Spaces: 4', encoding = 'UTF-8', eol = 'LF', language = 'Plain Text' }) {
    return (
        <div style={{
            height: '24px',
            backgroundColor: '#007acc', // VS Code blue
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            fontSize: '12px',
            fontFamily: 'sans-serif',
            justifyContent: 'flex-end',
            gap: '15px'
        }}>
            <div style={{ cursor: 'pointer' }}>Ln {line}, Col {col}</div>
            <div style={{ cursor: 'pointer' }}>{indentation}</div>
            <div style={{ cursor: 'pointer' }}>{encoding}</div>
            <div style={{ cursor: 'pointer' }}>{eol}</div>
            <div style={{ cursor: 'pointer', fontWeight: 'bold' }}>{language}</div>
        </div>
    );
}
