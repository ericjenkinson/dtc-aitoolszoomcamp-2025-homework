import React from 'react';

export function ConfirmationDialog({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
        }}>
            <div style={{
                backgroundColor: '#252526',
                padding: '20px',
                borderRadius: '5px',
                width: '300px',
                border: '1px solid #454545',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                color: '#ccc'
            }}>
                <h3 style={{ marginTop: 0, color: '#fff' }}>{title}</h3>
                <p style={{ marginBottom: '20px' }}>{message}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: 'transparent',
                            border: '1px solid #555',
                            color: '#ccc',
                            cursor: 'pointer',
                            borderRadius: '3px'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        title="Confirm"
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#007acc',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            borderRadius: '3px'
                        }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
