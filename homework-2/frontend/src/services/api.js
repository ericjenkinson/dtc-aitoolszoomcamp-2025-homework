const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
    async getInterviews() {
        try {
            const response = await fetch(`${API_URL}/interviews/`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error('Error fetching interviews:', error);
            return [];
        }
    },

    async createInterview(name) {
        try {
            const response = await fetch(`${API_URL}/interviews/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (!response.ok) throw new Error('Failed to create interview');
            return await response.json();
        } catch (error) {
            console.error('Error creating interview:', error);
            throw error;
        }
    },

    async deleteInterview(id) {
        try {
            const response = await fetch(`${API_URL}/interviews/${id}`, { method: 'DELETE' });
            return response.ok;
        } catch (error) {
            console.error('Error deleting interview:', error);
            return false;
        }
    },

    async listFiles(interviewId) {
        try {
            const response = await fetch(`${API_URL}/files/?interview_id=${interviewId}`);
            if (!response.ok) {
                const text = await response.text();
                console.error(`List files failed: ${response.status} ${text}`);
                throw new Error('Failed to fetch files');
            }
            return await response.json();
        } catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    },

    async createFile(name, content = '', interviewId) {
        try {
            console.log('Creating file:', name, 'at', `${API_URL}/files/`, 'for interview', interviewId);
            const response = await fetch(`${API_URL}/files/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, content, interview_id: interviewId }),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to create file: ${response.status} ${text}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating file:', error);
            throw error; // Propagate error to caller
        }
    },

    async getFile(id) {
        try {
            const response = await fetch(`${API_URL}/files/${id}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Error fetching file:', error);
            return null;
        }
    },

    async saveFile(id, content) {
        try {
            const response = await fetch(`${API_URL}/files/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content }),
            });
            return response.ok;
        } catch (error) {
            console.error('Error saving file:', error);
            return false;
        }
    },

    // WebSocket simulation for now (until we implement real WebSockets)
    joinSession(fileId, userId, onEvent) {
        // For now, no-op or simulate generic events
        // Real implementation would connect to a WS endpoint
        return () => { };
    }
};

export const mockBackend = api; // Alias for backward compatibility if needed, but we should switch imports
