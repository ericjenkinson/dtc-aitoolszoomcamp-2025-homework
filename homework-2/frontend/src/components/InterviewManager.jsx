import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function InterviewManager({ onSelectInterview }) {
    const [interviews, setInterviews] = useState([]);
    const [newInterviewName, setNewInterviewName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchInterviews = async () => {
        setLoading(true);
        const data = await api.getInterviews();
        setInterviews(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchInterviews();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newInterviewName.trim()) return;

        try {
            const created = await api.createInterview(newInterviewName);
            setInterviews(prev => [...prev, created]);
            setNewInterviewName('');
            onSelectInterview(created);
        } catch (err) {
            setError('Failed to create interview');
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure? This will delete all files in this interview.')) return;

        const success = await api.deleteInterview(id);
        if (success) {
            setInterviews(prev => prev.filter(i => i.id !== id));
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#252526',
                padding: '30px',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '500px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}>
                <h1 style={{ marginTop: 0, textAlign: 'center' }}>Interview Manager</h1>

                <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="Interview Name (e.g. Candidate A)"
                        value={newInterviewName}
                        onChange={e => setNewInterviewName(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#3c3c3c',
                            border: '1px solid #3c3c3c',
                            color: '#fff',
                            borderRadius: '4px'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newInterviewName.trim()}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#007acc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Create
                    </button>
                </form>

                {error && <div style={{ color: '#f88', marginBottom: '10px' }}>{error}</div>}

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {loading ? (
                        <p>Loading...</p>
                    ) : interviews.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#888' }}>No interviews found. Create one to start.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {interviews.map(interview => (
                                <div
                                    key={interview.id}
                                    onClick={() => onSelectInterview(interview)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px',
                                        backgroundColor: '#333',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#444'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#333'}
                                >
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{interview.name}</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>
                                            ID: {interview.id} • {new Date(interview.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(interview.id, e)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#666',
                                            cursor: 'pointer',
                                            padding: '5px',
                                            fontSize: '16px'
                                        }}
                                        title="Delete Interview"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
