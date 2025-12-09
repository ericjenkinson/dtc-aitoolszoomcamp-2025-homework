from typing import List, Dict
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # file_id -> list of active websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, file_id: str):
        await websocket.accept()
        if file_id not in self.active_connections:
            self.active_connections[file_id] = []
        self.active_connections[file_id].append(websocket)

    def disconnect(self, websocket: WebSocket, file_id: str):
        if file_id in self.active_connections:
            if websocket in self.active_connections[file_id]:
                self.active_connections[file_id].remove(websocket)
            if not self.active_connections[file_id]:
                del self.active_connections[file_id]

    async def broadcast(self, message: dict, file_id: str, exclude: WebSocket = None):
        if file_id in self.active_connections:
            for connection in self.active_connections[file_id]:
                if connection != exclude:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        print(f"Error sending message: {e}")
