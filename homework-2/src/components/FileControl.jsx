import React, { useState } from 'react';

export function FileControl({ onCreateFile, onSave, fileName }) {
    const [newFileName, setNewFileName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = () => {
        if (newFileName.trim()) {
            onCreateFile(newFileName);
            setNewFileName('');
            setIsCreating(false);
        }
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

                <div style={{ fontWeight: 'bold' }}>
                    {fileName ? fileName : 'No file selected'}
                </div>
            </div>

            <div>
                <button onClick={onSave} disabled={!fileName}>Save</button>
            </div>
        </div>
    );
}
