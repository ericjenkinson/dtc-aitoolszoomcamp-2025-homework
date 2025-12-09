from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from database import create_db_and_tables
from routers import files, interviews
from connection_manager import ConnectionManager

manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Only initialize DB if explicitly told to (or default to True if not specified, 
    # but for Docker consumption we will control this).
    # For local dev (no env var), it should still work. 
    # But wait, if we want to default to running it for local dev, 
    # we should default to "true".
    # In Docker, we will set it to "false" for the workers.
    if os.getenv("RUN_DB_INIT", "true").lower() == "true":
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

# Mount static files
# Ensure 'static' directory exists or is handled gracefully if missing during dev
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API routes to pass through (FastAPI matches them first if defined above)
        # Check if file exists in static root (e.g., favicon.ico)
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        # Fallback to index.html for SPA routing
        return FileResponse(os.path.join(static_dir, "index.html"))

@app.get("/api/health")
def read_root():
    return {"message": "Welcome to the Online Code Editor API"}
