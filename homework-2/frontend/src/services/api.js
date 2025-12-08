const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
    async getInterviews() {
        try {
            const response = await fetch(`${API_URL}/interviews/`);
            if (!response.ok) return [];
            const data = await response.json();
            return Array.isArray(data) ? data : [];
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

    // WebSocket connection
    joinSession(fileId, userId, onEvent) {
        const wsProtocol = API_URL.startsWith('https') ? 'wss' : 'ws';
        const wsHost = API_URL.replace(/^http(s)?:\/\//, '');
        const wsUrl = `${wsProtocol}://${wsHost}/ws/${fileId}/${userId}`;

        console.log('Connecting to WS:', wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WS Connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onEvent(data);
            } catch (e) {
                console.error('Error parsing WS message:', e);
            }
        };

        ws.onclose = () => {
            console.log('WS Disconnected');
        };

        ws.onerror = (error) => {
            console.error('WS Error:', error);
        };

        // Return a sender function and a cleanup function ? 
        // Or actually calling logic expects just a disconnect function?
        // Wait, App.jsx uses it like `const disconnect = api.joinSession(...)`.
        // Ideally we need to send messages too.
        // We can attach `send` to the return object or change API structure.
        // BUT App.jsx currently only consumes events. It needs to SEND too.
        // The current App.jsx doesn't have a mechanism to SEND via this specific connection instance easily unless we expose it.
        // Let's modify App.jsx to use `api.sendMessage`? Or `api.joinSession` returns object { disconnect, send }.

        // For minimal refactor, let's attach send to the return or a separate method?
        // Actually, App.jsx implementation of `joinSession` (useEffect/callback) calls it and gets a disconnect clbk.
        // We need to change `joinSession` to return { disconnect, send } OR we use a global/cached socket (risky).

        // Let's update App.jsx to expect { disconnect, sendMessage }

        return {
            disconnect: () => {
                if (ws.readyState === WebSocket.OPEN) ws.close();
            },
            sendMessage: (msg) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(msg));
                }
            }
        };
    }
};

export const mockBackend = api; // Alias for backward compatibility if needed, but we should switch imports
