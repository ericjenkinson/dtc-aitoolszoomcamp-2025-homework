from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime, timezone

from database import get_session
from models import File, FileCreate, FileRead, FileUpdate

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/", response_model=FileRead)
def create_file(*, session: Session = Depends(get_session), file: FileCreate):
    # Set language based on extension if not provided or just checking
    if not file.language or file.language == "plaintext":
        if file.name.endswith(".js"):
            file.language = "javascript"
        elif file.name.endswith(".py"):
            file.language = "python"
    
    db_file = File.model_validate(file)
    session.add(db_file)
    session.commit()
    session.refresh(db_file)
    return db_file

@router.get("/{file_id}", response_model=FileRead)
def read_file(*, session: Session = Depends(get_session), file_id: int):
    file = session.get(File, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return file

@router.put("/{file_id}", response_model=FileRead)
def update_file(*, session: Session = Depends(get_session), file_id: int, file_update: FileUpdate):
    db_file = session.get(File, file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_data = file_update.model_dump(exclude_unset=True)
    for key, value in file_data.items():
        setattr(db_file, key, value)
    
    db_file.last_modified = datetime.now(timezone.utc)
    session.add(db_file)
    session.commit()
    session.refresh(db_file)
    return db_file
