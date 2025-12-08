// Simulating a backend with local storage and simulated socket events

class MockBackendService {
    constructor() {
        this.files = new Map();
        this.subscribers = new Map(); // fileId -> Set<callback>
        this.cursors = new Map(); // fileId -> Map<userId, position>

        // Seed some data
        this.createFile('example.js', '// Welcome to the editor\nconsole.log("Hello World");');
    }

    createFile(name, content = '') {
        const id = Math.random().toString(36).substr(2, 9);
        const file = {
            id,
            name,
            content,
            language: this.getLanguageFromExtension(name),
            lastModified: new Date().toISOString()
        };
        this.files.set(id, file);
        return file;
    }

    getLanguageFromExtension(filename) {
        if (filename.endsWith('.js')) return 'javascript';
        if (filename.endsWith('.py')) return 'python';
        return 'plaintext';
    }

    getFile(id) {
        return this.files.get(id);
    }

    saveFile(id, content) {
        const file = this.files.get(id);
        if (file) {
            file.content = content;
            file.lastModified = new Date().toISOString();
            this.files.set(id, file);
            return true;
        }
        return false;
    }

    // Simulation of websocket connection
    joinSession(fileId, userId, onEvent) {
        if (!this.subscribers.has(fileId)) {
            this.subscribers.set(fileId, new Set());
        }
        this.subscribers.get(fileId).add(onEvent);

        // Simulate other users
        setTimeout(() => {
            onEvent({ type: 'user_joined', userId: 'ipsum-user', name: 'Interviewer' });
            this.simulateRemoteActivity(fileId, 'ipsum-user');
        }, 1000);

        return () => {
            const subs = this.subscribers.get(fileId);
            if (subs) {
                subs.delete(onEvent);
            }
        };
    }

    broadcast(fileId, event) {
        const subs = this.subscribers.get(fileId);
        if (subs) {
            subs.forEach(cb => cb(event));
        }
    }

    // Simulate remote user typing and moving cursor
    simulateRemoteActivity(fileId, userId) {
        setInterval(() => {
            // 30% chance to move cursor
            if (Math.random() > 0.7) {
                const file = this.getFile(fileId);
                if (!file) return;
                const pos = Math.floor(Math.random() * file.content.length);

                this.broadcast(fileId, {
                    type: 'cursor_update',
                    userId,
                    position: pos
                });
            }
        }, 2000);
    }

    sendCursorUpdate(fileId, userId, position) {
        // In a real app, this would go to server and come back
        // Here we just broadcast to others (excluding self if we filtered, but simplified here)
        this.broadcast(fileId, {
            type: 'cursor_update',
            userId,
            position
        });
    }

    sendDocUpdate(fileId, userId, changes) {
        this.broadcast(fileId, {
            type: 'doc_update',
            userId,
            changes
        });
    }
}

export const mockBackend = new MockBackendService();
