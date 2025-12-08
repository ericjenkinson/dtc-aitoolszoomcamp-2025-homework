import React from 'react';

export function OutputPanel({ output, result, error, onClose, ...props }) {
    if (!output && !error && !result) return null;

    return (
        <div {...props} style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30vh',
            backgroundColor: '#1e1e1e',
            borderTop: '1px solid #333',
            color: '#fff',
            padding: '10px',
            overflow: 'auto',
            zIndex: 100,
            fontFamily: 'monospace'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#888' }}>OUTPUT</span>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#888',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    ×
                </button>
            </div>

            {output && (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#dbdbdb' }}>
                    {Array.isArray(output) ? output.join('\n') : output}
                </pre>
            )}

            {result !== undefined && result !== null && (
                <pre style={{ margin: '10px 0 0 0', whiteSpace: 'pre-wrap', color: '#4caf50' }}>
                    {'> ' + String(result)}
                </pre>
            )}

            {error && (
                <pre style={{ margin: '10px 0 0 0', whiteSpace: 'pre-wrap', color: '#ff5555' }}>
                    {error}
                </pre>
            )}
        </div>
    );
}
