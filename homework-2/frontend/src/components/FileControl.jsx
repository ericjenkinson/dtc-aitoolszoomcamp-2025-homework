import React, { useState, useEffect } from 'react';
import { api } from '../services/api';


export function FileControl({ fileName, onSave, onRun, isRunning, runReady, runButtonLabel, interviewName, onExit }) {
    // Removed Dialog logic


    return (
        <>
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
                    <button
                        onClick={onExit}
                        style={{
                            backgroundColor: '#333',
                            color: '#ccc',
                            border: '1px solid #555',
                            marginRight: '10px'
                        }}
                        title="Exit Interview"
                        data-testid="exit-interview-button"
                    >
                        ← {interviewName}
                    </button>
                    {/* New File and Load File moved to FileExplorer */}
                </div>

                <div style={{ fontWeight: 'bold', marginLeft: '20px' }}>
                    {fileName ? fileName : 'No file selected'}
                </div>
            </div>

            <div style={{ padding: '10px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <button onClick={onSave} disabled={!fileName} style={{ marginRight: '10px' }}>Save</button>
                <div style={{ width: '1px', height: '20px', backgroundColor: '#333', margin: '0 10px', display: 'inline-block', verticalAlign: 'middle' }} />
                <button
                    data-testid="run-button"
                    onClick={onRun}
                    disabled={!runReady || isRunning}
                    style={{
                        opacity: (!runReady || isRunning) ? 0.5 : 1,
                        backgroundColor: isRunning ? '#d4a017' : '#4CAF50',
                        marginLeft: '5px'
                    }}
                >
                    {isRunning ? 'Running...' : (runButtonLabel || '▶ Run')}
                </button>
            </div>

        </>
    );
}
