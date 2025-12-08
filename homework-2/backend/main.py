from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from database import create_db_and_tables
from routers import files, interviews
from connection_manager import ConnectionManager

manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(files.router)
app.include_router(interviews.router)

@app.websocket("/ws/{interview_id}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, interview_id: str, client_id: str):
    await manager.connect(websocket, interview_id)
    try:
        # Notify others that a user joined
        await manager.broadcast({
            "type": "user_joined",
            "userId": client_id
        }, interview_id, exclude=websocket)
        
        while True:
            data = await websocket.receive_json()
            # Broadcast whatever we receive
            data["userId"] = client_id
            await manager.broadcast(data, interview_id, exclude=websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, interview_id)
        # Optional: Notify user left
        await manager.broadcast({
            "type": "user_left",
            "userId": client_id
        }, interview_id)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Online Code Editor API"}
