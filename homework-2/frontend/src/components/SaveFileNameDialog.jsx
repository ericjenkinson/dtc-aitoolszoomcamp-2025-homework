import React, { useState, useEffect } from 'react';

export function SaveFileNameDialog({ isOpen, onClose, onSave }) {
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFileName('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!fileName.trim()) {
            setError('Filename cannot be empty');
            return;
        }
        if (!fileName.endsWith('.py') && !fileName.endsWith('.js')) {
            setError('File must end with .py or .js');
            return;
        }
        onSave(fileName);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#1e1e1e',
                padding: '20px',
                borderRadius: '5px',
                border: '1px solid #333',
                minWidth: '300px',
                color: '#ccc'
            }}>
                <h3 style={{ marginTop: 0 }}>Save As</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <input
                            autoFocus
                            type="text"
                            value={fileName}
                            onChange={e => {
                                setFileName(e.target.value);
                                setError('');
                            }}
                            placeholder="filename.js or .py"
                            style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: '#252526',
                                border: '1px solid #333',
                                color: '#ccc',
                                boxSizing: 'border-box'
                            }}
                        />
                        {error && <div style={{ color: 'var(--danger-color)', marginTop: '5px', fontSize: '12px' }}>{error}</div>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} style={{ backgroundColor: '#444' }}>Cancel</button>
                        <button type="submit" style={{ backgroundColor: 'var(--primary-color)' }}>Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
