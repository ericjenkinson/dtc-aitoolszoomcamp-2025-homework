const API_URL = 'http://localhost:8000';

export const api = {
    async listFiles() {
        try {
            const response = await fetch(`${API_URL}/files/`);
            if (!response.ok) throw new Error('Failed to fetch files');
            return await response.json();
        } catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    },

    async createFile(name, content = '') {
        try {
            const response = await fetch(`${API_URL}/files/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, content }),
            });
            if (!response.ok) throw new Error('Failed to create file');
            return await response.json();
        } catch (error) {
            console.error('Error creating file:', error);
            return null;
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
